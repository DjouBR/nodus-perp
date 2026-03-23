import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_types, session_athletes } from '@/lib/db/schema/sessions'
import { users } from '@/lib/db/schema/users'
import { eq, and, gte, ne } from 'drizzle-orm'

const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

function computeStatus(row) {
  if (row.status === 'cancelled') return 'cancelled'
  const now   = Date.now()
  const start = new Date(row.start_datetime).getTime()
  const end   = new Date(row.end_datetime).getTime()
  if (now >= start && now < end) return 'active'
  if (now >= end)                return 'finished'
  return 'scheduled'
}

/**
 * GET /api/dashboard/athlete/sessions
 * Retorna até 2 próximas sessões para o card do dashboard do atleta.
 *
 * Lógica por role:
 * - academy_athlete / coach_athlete: todas as sessões abertas do tenant
 * - athlete:                         apenas sessões em que está inscrito
 *
 * Ordenação:
 * 1. check-in já feito (checked_in = 1)
 * 2. inscrito sem check-in
 * 3. demais sessões abertas da academia
 */
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId, tenant_id: tenantId } = session.user

  if (!ATHLETE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const now = new Date()

  try {
    const rows = await db
      .select({
        id:             training_sessions.id,
        name:           training_sessions.name,
        start_datetime: training_sessions.start_datetime,
        end_datetime:   training_sessions.end_datetime,
        duration_min:   training_sessions.duration_min,
        status:         training_sessions.status,
        capacity:       training_sessions.capacity,
        coach_name:     users.name,
        type_name:      session_types.name,
        type_color:     session_types.color,
        type_icon:      session_types.icon,
        checked_in:     session_athletes.checked_in,
        athlete_id:     session_athletes.athlete_id,
      })
      .from(training_sessions)
      .leftJoin(users,         eq(training_sessions.coach_id,        users.id))
      .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
      .leftJoin(
        session_athletes,
        and(
          eq(session_athletes.session_id, training_sessions.id),
          eq(session_athletes.athlete_id, userId)
        )
      )
      .where(
        and(
          gte(training_sessions.end_datetime, now),   // apenas futuras/ativas
          ne(training_sessions.status, 'cancelled'),  // exclui canceladas
          role === 'athlete'
            ? eq(session_athletes.athlete_id, userId)    // independente: só as suas
            : eq(training_sessions.tenant_id, tenantId)  // academia: todas do tenant
        )
      )

    // Aplica status on-the-fly e remove finished
    const filtered = rows
      .map(r => ({ ...r, status: computeStatus(r) }))
      .filter(r => r.status !== 'finished')

    // Ordena: check-in feito (0) → inscrito (1) → demais (2) → por data
    const priority = r => {
      if (r.checked_in === 1)      return 0
      if (r.athlete_id === userId) return 1
      return 2
    }

    filtered.sort((a, b) => {
      const pd = priority(a) - priority(b)
      if (pd !== 0) return pd
      return new Date(a.start_datetime) - new Date(b.start_datetime)
    })

    const result = filtered.slice(0, 2).map(r => ({
      id:             r.id,
      name:           r.name,
      start_datetime: r.start_datetime,
      end_datetime:   r.end_datetime,
      duration_min:   r.duration_min,
      status:         r.status,
      capacity:       r.capacity,
      coach_name:     r.coach_name,
      type_name:      r.type_name,
      type_color:     r.type_color,
      type_icon:      r.type_icon,
      checked_in:     r.checked_in ?? 0,
      is_enrolled:    r.athlete_id === userId,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/dashboard/athlete/sessions]', err)
    return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })
  }
}
