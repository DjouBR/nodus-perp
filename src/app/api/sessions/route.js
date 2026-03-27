import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_types, session_athletes } from '@/lib/db/schema/sessions'
import { users } from '@/lib/db/schema/users'
import { eq, and, desc, ne } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const STAFF_ROLES   = ['tenant_admin', 'academy_coach', 'coach']
const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

function computeStatus(row) {
  if (row.status === 'cancelled') return 'cancelled'
  if (row.status === 'finished')  return 'finished'
  if (row.status === 'active')    return 'active'
  // Para sessões 'scheduled', usa scheduled_start como referência do calendário
  const now   = Date.now()
  const start = new Date(row.scheduled_start ?? row.start_datetime).getTime()
  const end   = new Date(row.scheduled_end   ?? row.end_datetime).getTime()
  if (now >= start && now < end) return 'active'
  if (now >= end)                return 'finished'
  return 'scheduled'
}

function tenantFilter(user) {
  if (user.role === 'coach') return eq(training_sessions.coach_id, user.id)
  return eq(training_sessions.tenant_id, user.tenant_id)
}

// Campos sem checked_in — usado para staff
const SESSION_SELECT_STAFF = {
  id:                  training_sessions.id,
  name:                training_sessions.name,
  start_datetime:      training_sessions.start_datetime,
  end_datetime:        training_sessions.end_datetime,
  scheduled_start:     training_sessions.scheduled_start,
  scheduled_end:       training_sessions.scheduled_end,
  duration_min:        training_sessions.duration_min,
  status:              training_sessions.status,
  capacity:            training_sessions.capacity,
  notes:               training_sessions.notes,
  target_zone_min:     training_sessions.target_zone_min,
  target_zone_max:     training_sessions.target_zone_max,
  coach_id:            training_sessions.coach_id,
  session_type_id:     training_sessions.session_type_id,
  recurrence_group_id: training_sessions.recurrence_group_id,
  recurrence_rule:     training_sessions.recurrence_rule,
  coach_name:          users.name,
  type_name:           session_types.name,
  type_color:          session_types.color,
  type_icon:           session_types.icon,
}

// Campos com checked_in — usado para atletas
const SESSION_SELECT_ATHLETE = {
  ...SESSION_SELECT_STAFF,
  checked_in: session_athletes.checked_in,
}

// GET /api/sessions
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId } = session.user

  try {
    // ── Atleta independente: só vê as próprias sessões (INNER JOIN) ──
    if (role === 'athlete') {
      const rows = await db
        .select(SESSION_SELECT_ATHLETE)
        .from(session_athletes)
        .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
        .leftJoin(users,         eq(training_sessions.coach_id,        users.id))
        .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
        .where(eq(session_athletes.athlete_id, userId))
        .orderBy(desc(training_sessions.start_datetime))

      return NextResponse.json(rows.map(r => ({ ...r, status: computeStatus(r) })))
    }

    // ── Aluno de academia / coach_athlete: vê TODAS as sessões do tenant ──
    if (role === 'academy_athlete' || role === 'coach_athlete') {
      const { tenant_id: tenantId } = session.user

      const rows = await db
        .select(SESSION_SELECT_ATHLETE)
        .from(training_sessions)
        .leftJoin(
          session_athletes,
          and(
            eq(session_athletes.session_id,  training_sessions.id),
            eq(session_athletes.athlete_id,  userId)
          )
        )
        .leftJoin(users,         eq(training_sessions.coach_id,        users.id))
        .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
        .where(
          and(
            eq(training_sessions.tenant_id, tenantId),
            ne(training_sessions.status, 'cancelled')
          )
        )
        .orderBy(desc(training_sessions.start_datetime))

      return NextResponse.json(rows.map(r => ({ ...r, status: computeStatus(r) })))
    }

    // ── Staff: retorna todas as sessões do tenant/coach ──
    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const sessions = await db
      .select(SESSION_SELECT_STAFF)
      .from(training_sessions)
      .leftJoin(users,         eq(training_sessions.coach_id,        users.id))
      .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
      .where(tenantFilter(session.user))

    return NextResponse.json(sessions.map(r => ({ ...r, status: computeStatus(r) })))
  } catch (err) {
    console.error('[GET /api/sessions]', err)
    return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })
  }
}

// POST /api/sessions
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId, tenant_id: tenantId } = session.user

  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, session_type_id, coach_id,
    start_datetime, duration_min, capacity,
    target_zone_min, target_zone_max, notes,
    recurrence_rule, recurrence_end_date,
    athlete_ids,
  } = body

  if (!name || !start_datetime) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const finalCoachId  = (role === 'academy_coach' || role === 'coach') ? userId : (coach_id || userId)
  const finalTenantId = role === 'coach' ? null : tenantId
  const durMin        = duration_min || 60
  const DAY_MAP       = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }

  // scheduled_start e scheduled_end são imutáveis — guardam o horário original da agenda
  const buildRow = (start, groupId = null) => {
    const end = new Date(start.getTime() + durMin * 60_000)
    return {
      id:                   randomUUID(),
      tenant_id:            finalTenantId,
      session_type_id:      session_type_id || null,
      coach_id:             finalCoachId,
      name,
      start_datetime:       start,        // será sobrescrito pelo cronômetro real no /start
      end_datetime:         end,          // será sobrescrito pelo cronômetro real no /finish
      scheduled_start:      start,        // imutável — horário da agenda
      scheduled_end:        end,          // imutável — horário da agenda
      duration_min:         durMin,
      capacity:             capacity || 30,
      target_zone_min:      target_zone_min || 2,
      target_zone_max:      target_zone_max || 4,
      notes:                notes || null,
      status:               'scheduled',
      recurrence_group_id:  groupId,
      recurrence_rule:      groupId ? recurrence_rule : null,
      recurrence_end_date:  groupId ? new Date(recurrence_end_date) : null,
    }
  }

  const insertAthletes = async (sessionId, ids) => {
    if (!ids || ids.length === 0) return
    const rows = ids.map(aid => ({ id: randomUUID(), session_id: sessionId, athlete_id: aid, checked_in: 0 }))
    await db.insert(session_athletes).values(rows)
  }

  try {
    if (!recurrence_rule || !recurrence_end_date) {
      const start = new Date(start_datetime)
      const row   = buildRow(start)
      await db.insert(training_sessions).values(row)
      await insertAthletes(row.id, athlete_ids)
      return NextResponse.json({ id: row.id }, { status: 201 })
    }

    const days    = recurrence_rule.split(',').map(d => DAY_MAP[d.trim().toUpperCase()]).filter(d => d !== undefined)
    const endDate = new Date(recurrence_end_date + 'T23:59:59')
    const base    = new Date(start_datetime)
    const baseH   = base.getHours()
    const baseM   = base.getMinutes()
    const groupId = randomUUID()
    const rows    = []
    const cursor  = new Date(base)
    cursor.setHours(0, 0, 0, 0)

    while (cursor <= endDate) {
      if (days.includes(cursor.getDay())) {
        const start = new Date(cursor)
        start.setHours(baseH, baseM, 0, 0)
        rows.push(buildRow(start, groupId))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma ocorrência gerada para os dias selecionados' }, { status: 400 })
    }

    for (let i = 0; i < rows.length; i += 50) {
      await db.insert(training_sessions).values(rows.slice(i, i + 50))
    }
    for (const row of rows) await insertAthletes(row.id, athlete_ids)

    return NextResponse.json({ recurrence_group_id: groupId, count: rows.length }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions]', err)
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })
  }
}
