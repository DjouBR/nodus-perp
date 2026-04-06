import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { eq, and, gte } from 'drizzle-orm'

/**
 * Interpreta uma string de data/hora como horário local de Brasília (UTC-3).
 * O input datetime-local do browser envia strings sem timezone (ex: "2026-04-06T08:00").
 * new Date() no Node.js interpreta isso como UTC, causando offset de +3h no banco.
 */
function parseDatetimeLocal(str) {
  if (!str) return null
  // Se já tem offset explícito (+/-) ou Z, usa direto
  if (/[+\-Z]/.test(str.slice(10))) return new Date(str)
  // Sem offset: interpreta como Brasília (UTC-3)
  return new Date(str + '-03:00')
}

/**
 * Serializa um objeto do Drizzle convertendo todos os campos Date para ISO string.
 * Necessário para evitar o erro RSC: "Only plain objects can be passed to Client Components".
 */
function serializeRow(row) {
  if (!row || typeof row !== 'object') return row
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = v instanceof Date ? v.toISOString() : v
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/sessions/[id]
// Retorna dados da sessão + lista de atletas para o Lobby (Tela 1)
// ─────────────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    // 1. Busca dados da sessão
    const [row] = await db
      .select()
      .from(training_sessions)
      .where(and(
        eq(training_sessions.id, id),
        // coach independente (tenant_id null): vê só as próprias sessões
        // tenant_admin/academy_coach: filtra pelo tenant
        session.user.tenant_id
          ? eq(training_sessions.tenant_id, session.user.tenant_id)
          : eq(training_sessions.coach_id, session.user.id)
      ))

    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // 2. Busca atletas inscritos na sessão com dados do perfil
    const athleteRows = await db
      .select({
        // Dados de inscrição
        athlete_id:  session_athletes.athlete_id,
        sensor_id:   session_athletes.sensor_id,
        checked_in:  session_athletes.checked_in,
        checkin_at:  session_athletes.checkin_at,
        // Dados do usuário
        name:        users.name,
        email:       users.email,
        avatar_url:  users.avatar_url,
        gender:      users.gender,
        // Dados do perfil esportivo
        hr_max:      athlete_profiles.hr_max,
        hr_rest:     athlete_profiles.hr_rest,
        weight_kg:   athlete_profiles.weight_kg,
      })
      .from(session_athletes)
      .innerJoin(users,            eq(users.id,            session_athletes.athlete_id))
      .leftJoin(athlete_profiles,  eq(athlete_profiles.user_id, session_athletes.athlete_id))
      .where(eq(session_athletes.session_id, id))
      .orderBy(users.name)

    // Serializa datas do Drizzle para ISO string antes de enviar ao client
    const serializedSession  = serializeRow(row)
    const serializedAthletes = athleteRows.map(serializeRow)

    return NextResponse.json({
      session:  serializedSession,
      athletes: serializedAthletes,
    })
  } catch (err) {
    console.error('[GET /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────
// PUT /api/sessions/[id]
// ─────────────────────────────────────────────────────────────────────
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = session.user.role
  if (!['tenant_admin', 'academy_coach', 'coach'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const {
    name, session_type_id, coach_id,
    start_datetime, duration_min, capacity,
    target_zone_min, target_zone_max, notes, status
  } = body

  const [existing] = await db
    .select({ coach_id: training_sessions.coach_id, tenant_id: training_sessions.tenant_id })
    .from(training_sessions)
    .where(eq(training_sessions.id, id))

  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (role === 'academy_coach' && existing.coach_id !== session.user.id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  if (role === 'coach' && existing.coach_id !== session.user.id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  if (role === 'tenant_admin' && existing.tenant_id !== session.user.tenant_id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const durMin = duration_min || 60
  const start  = parseDatetimeLocal(start_datetime)
  const end    = new Date(start.getTime() + durMin * 60_000)

  try {
    await db.update(training_sessions)
      .set({
        name,
        session_type_id: session_type_id || null,
        coach_id:        coach_id || session.user.id,
        start_datetime:  start,
        end_datetime:    end,
        scheduled_start: start,
        scheduled_end:   end,
        duration_min:    durMin,
        capacity:        capacity || 30,
        target_zone_min: target_zone_min ?? 2,
        target_zone_max: target_zone_max ?? 4,
        notes:           notes || null,
        ...(status ? { status } : {}),
      })
      .where(eq(training_sessions.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/sessions/[id]
// Query params:
//   ?scope=single  → apaga só esta sessão (default)
//   ?scope=future  → apaga esta e todas as futuras do mesmo grupo
// ─────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = session.user.role
  if (!['tenant_admin', 'academy_coach', 'coach'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'single'

  const [target] = await db.select()
    .from(training_sessions)
    .where(eq(training_sessions.id, id))

  if (!target) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if ((role === 'academy_coach' || role === 'coach') && target.coach_id !== session.user.id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  if (role === 'tenant_admin' && target.tenant_id !== session.user.tenant_id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  try {
    if (scope === 'future' && target.recurrence_group_id) {
      await db.delete(training_sessions)
        .where(and(
          eq(training_sessions.recurrence_group_id, target.recurrence_group_id),
          gte(training_sessions.start_datetime, target.start_datetime)
        ))
    } else {
      await db.delete(training_sessions)
        .where(eq(training_sessions.id, id))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro ao excluir sessão' }, { status: 500 })
  }
}
