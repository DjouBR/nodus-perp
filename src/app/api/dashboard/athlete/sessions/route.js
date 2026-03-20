import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_types, session_athletes } from '@/lib/db/schema/sessions'
import { users } from '@/lib/db/schema/users'
import { eq, and, gte, or, isNull } from 'drizzle-orm'

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
 * Retorna as próximas sessões para o card do dashboard do atleta.
 *
 * Lógica por role:
 * - academy_athlete: todas as sessões abertas do tenant (não só as que foi adicionado)
 * - coach_athlete:   sessões do tenant do coach (onde está inscrito ou abertas)
 * - athlete:         apenas sessões em que está inscrito
 *
 * Ordenação:
 * 1. Sessões com check-in feito pelo atleta (checked_in=1) — primeiro
 * 2. Sessões em que o atleta está inscrito (sem check-in)
 * 3. Demais sessões abertas da academia
 *
 * Limite: 2 sessões (para o card do dashboard)
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
    // ── Busca sessões futuras + inscrições do atleta num join único ──
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
        // null se atleta não estiver inscrito
        checked_in:     session_athletes.checked_in,
        athlete_id:     session_athletes.athlete_id,
      })
      .from(training_sessions)
      .leftJoin(users,            eq(training_sessions.coach_id,       users.id))
      .leftJoin(session_types,    eq(training_sessions.session_type_id, session_types.id))
      // left join: traz a inscrição do atleta se existir, mas não filtra
      .leftJoin(
        session_athletes,
        and(
          eq(session_athletes.session_id,  training_sessions.id),
          eq(session_athletes.athlete_id,  userId)
        )
      )
      .where(
        and(
          // Apenas sessões futuras ou ativas
          gte(training_sessions.end_datetime, now),
          // Não canceladas
          // (usamos computeStatus depois, mas filtramos cancelled no banco)
          or(
            isNull(training_sessions.status),
          ),
          // Isolamento por tenant
          role === 'athlete'
            ? eq(session_athletes.athlete_id, userId)   // atleta independente: só as suas
            : eq(training_sessions.tenant_id, tenantId) // academy/coach_athlete: todas do tenant
        )
      )

    // Remove sessões canceladas e já terminadas
    const filtered = rows
      .map(r => ({ ...r, status: computeStatus(r) }))
      .filter(r => r.status !== 'cancelled' && r.status !== 'finished')

    // Ordenação:
    // 0 = checked_in=1 (inscrito + check-in feito)
    // 1 = inscrito sem check-in (athlete_id não null, checked_in=0)
    // 2 = não inscrito (academy_athlete vê aulas abertas)
    const priority = r => {
      if (r.checked_in === 1)             return 0
      if (r.athlete_id === userId)        return 1
      return 2
    }

    filtered.sort((a, b) => {
      const pd = priority(a) - priority(b)
      if (pd !== 0) return pd
      return new Date(a.start_datetime) - new Date(b.start_datetime)
    })

    // Máximo 2 para o card
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
