import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles, sensors, daily_logs, weekly_indices, session_athletes, training_sessions } from '@/lib/db/schema/index.js'
import { eq, and, desc, sql } from 'drizzle-orm'

// ───────────────────────────────────────────────────────────────────
// GET /api/athletes/[id]
// Retorna perfil completo do atleta: dados, perfil esportivo,
// sensor vinculado, últimos 7 daily logs e últimas 10 sessões
// ───────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params

    // Busca usuário
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'athlete')))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }

    // Verifica acesso ao tenant
    if (session.user.role !== 'super_admin' &&
        session.user.tenant_id !== user.tenant_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Busca perfil esportivo
    const [profile] = await db
      .select()
      .from(athlete_profiles)
      .where(eq(athlete_profiles.user_id, id))
      .limit(1)

    // Busca sensor vinculado
    const [sensor] = await db
      .select()
      .from(sensors)
      .where(eq(sensors.athlete_id, id))
      .limit(1)

    // Últimos 7 daily logs
    const logs = await db
      .select()
      .from(daily_logs)
      .where(eq(daily_logs.athlete_id, id))
      .orderBy(desc(daily_logs.log_date))
      .limit(7)

    // Índice ACWR mais recente
    const [acwr] = await db
      .select()
      .from(weekly_indices)
      .where(eq(weekly_indices.athlete_id, id))
      .orderBy(desc(weekly_indices.week_start))
      .limit(1)

    // Últimas 10 sessões participadas
    const recentSessions = await db
      .select({
        session_id:      session_athletes.session_id,
        avg_hr:          session_athletes.avg_hr,
        max_hr:          session_athletes.max_hr,
        calories:        session_athletes.calories,
        trimp:           session_athletes.trimp,
        training_effect: session_athletes.training_effect,
        time_z1_sec:     session_athletes.time_z1_sec,
        time_z2_sec:     session_athletes.time_z2_sec,
        time_z3_sec:     session_athletes.time_z3_sec,
        time_z4_sec:     session_athletes.time_z4_sec,
        time_z5_sec:     session_athletes.time_z5_sec,
        session_name:    training_sessions.name,
        start_datetime:  training_sessions.start_datetime,
        duration_min:    training_sessions.duration_min,
        status:          training_sessions.status,
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(session_athletes.session_id, training_sessions.id))
      .where(eq(session_athletes.athlete_id, id))
      .orderBy(desc(training_sessions.start_datetime))
      .limit(10)

    // Remove campos sensíveis antes de retornar
    const { password_hash, ...safeUser } = user

    return NextResponse.json({
      ...safeUser,
      profile:         profile  ?? null,
      sensor:          sensor   ?? null,
      recent_logs:     logs,
      acwr:            acwr     ?? null,
      recent_sessions: recentSessions,
    })

  } catch (error) {
    console.error('[GET /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
