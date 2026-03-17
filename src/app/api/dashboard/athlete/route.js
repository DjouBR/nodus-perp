import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { weekly_indices } from '@/lib/db/schema/training'
import { eq, and, gte, lte, sql, count, sum, desc } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: athlete_id } = session.user
  if (!['athlete', 'academy_athlete', 'coach_athlete'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  try {
    // ── 1. Sessões e calorias do mês ──────────────────────────────
    const [monthStats] = await db
      .select({
        sessions: count(),
        calories: sum(session_athletes.calories),
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
      .where(
        and(
          eq(session_athletes.athlete_id, athlete_id),
          eq(session_athletes.checked_in, 1),
          gte(training_sessions.start_datetime, monthStart)
        )
      )

    // ── 2. Streak atual (dias consecutivos com sessão) ─────────────
    const recentSessions = await db
      .select({ date: training_sessions.start_datetime })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
      .where(
        and(
          eq(session_athletes.athlete_id, athlete_id),
          eq(session_athletes.checked_in, 1)
        )
      )
      .orderBy(desc(training_sessions.start_datetime))
      .limit(60)

    const uniqueDays = [...new Set(
      recentSessions.map(s => new Date(s.date).toISOString().slice(0, 10))
    )].sort().reverse()

    let streak = 0
    const checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)
    for (const dayStr of uniqueDays) {
      const expected = checkDate.toISOString().slice(0, 10)
      if (dayStr === expected) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }

    // ── 3. Ranking no tenant ───────────────────────────────────────
    const athleteInfo = await db
      .select({ tenant_id: users.tenant_id })
      .from(users)
      .where(eq(users.id, athlete_id))
      .limit(1)

    const tenantId = athleteInfo[0]?.tenant_id
    let ranking = null
    if (tenantId) {
      const rankRows = await db
        .select({
          athlete_id: session_athletes.athlete_id,
          calories: sum(session_athletes.calories),
        })
        .from(session_athletes)
        .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
        .where(
          and(
            eq(training_sessions.tenant_id, tenantId),
            gte(training_sessions.start_datetime, monthStart)
          )
        )
        .groupBy(session_athletes.athlete_id)
        .orderBy(sql`SUM(${session_athletes.calories}) DESC`)

      const pos = rankRows.findIndex(r => r.athlete_id === athlete_id)
      ranking = pos >= 0 ? pos + 1 : null
    }

    // ── 4. ACWR atual ─────────────────────────────────────────────
    const [acwrRow] = await db
      .select({ acwr: weekly_indices.acwr })
      .from(weekly_indices)
      .where(
        and(
          eq(weekly_indices.athlete_id, athlete_id),
          eq(weekly_indices.week_start, weekStart.toISOString().slice(0, 10))
        )
      )
      .limit(1)

    const acwr = acwrRow?.acwr ? Number(acwrRow.acwr) : null

    // ── 5. Próxima sessão ─────────────────────────────────────────
    const [nextSession] = await db
      .select({
        id: training_sessions.id,
        name: training_sessions.name,
        start_datetime: training_sessions.start_datetime,
        status: training_sessions.status,
        coach_id: training_sessions.coach_id,
        capacity: training_sessions.capacity,
        duration_min: training_sessions.duration_min,
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
      .where(
        and(
          eq(session_athletes.athlete_id, athlete_id),
          gte(training_sessions.start_datetime, now),
          sql`${training_sessions.status} IN ('scheduled', 'active')`
        )
      )
      .orderBy(training_sessions.start_datetime)
      .limit(1)

    let nextSessionData = null
    if (nextSession) {
      const [coachUser] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, nextSession.coach_id))
        .limit(1)
      nextSessionData = {
        ...nextSession,
        coach: coachUser?.name || '—',
        time: new Date(nextSession.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
    }

    // ── 6. Progresso do mês ───────────────────────────────────────
    const sessionGoal = 20
    const calorieGoal = 20000
    const consistencyPct = uniqueDays.length > 0
      ? Math.min(100, Math.round((uniqueDays.filter(d => {
          const dd = new Date(d)
          return dd >= monthStart && dd <= now
        }).length / ((now.getDate()) / 7 * 5)) * 100))
      : 0

    return NextResponse.json({
      stats: {
        sessionsThisMonth: Number(monthStats?.sessions || 0),
        caloriesthisMonth: Number(monthStats?.calories || 0),
        streak,
        ranking,
      },
      acwr,
      nextSession: nextSessionData,
      progress: {
        sessions:     { value: Number(monthStats?.sessions || 0), max: sessionGoal },
        calories:     { value: Number(monthStats?.calories || 0), max: calorieGoal },
        consistency:  { value: consistencyPct, max: 100 },
      },
    })
  } catch (err) {
    console.error('[dashboard/athlete]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
