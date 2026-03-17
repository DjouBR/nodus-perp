import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { weekly_indices } from '@/lib/db/schema/training'
import { eq, and, gte, lte, sql, count, sum, inArray, avg } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: coach_id, tenant_id } = session.user
  if (!['coach', 'academy_coach'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  try {
    // ── 1. Atletas do coach ────────────────────────────────────────
    const athleteRole = role === 'coach' ? 'coach_athlete' : 'academy_athlete'
    const [athleteCount] = await db
      .select({ total: count() })
      .from(users)
      .innerJoin(athlete_profiles, eq(athlete_profiles.user_id, users.id))
      .where(
        and(
          eq(users.role, athleteRole),
          eq(users.is_active, 1),
          eq(athlete_profiles.status, 'active'),
          role === 'coach'
            ? eq(athlete_profiles.coach_id, coach_id)
            : eq(users.tenant_id, tenant_id)
        )
      )

    // ── 2. Sessões do coach hoje ───────────────────────────────────
    const todaySessions = await db
      .select({
        id: training_sessions.id,
        name: training_sessions.name,
        start_datetime: training_sessions.start_datetime,
        status: training_sessions.status,
        participants_count: training_sessions.participants_count,
        avg_hr: training_sessions.avg_hr,
      })
      .from(training_sessions)
      .where(
        and(
          eq(training_sessions.coach_id, coach_id),
          gte(training_sessions.start_datetime, today),
          lte(training_sessions.start_datetime, todayEnd)
        )
      )
      .orderBy(training_sessions.start_datetime)

    const sessionsToday = todaySessions.map(s => ({
      ...s,
      coach: 'Você',
      time: s.start_datetime ? new Date(s.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
    }))

    const activeSessions = sessionsToday.filter(s => s.status === 'active').length

    // ── 3. FC média do grupo (sessões de hoje) ─────────────────────
    const hrValues = sessionsToday.filter(s => s.avg_hr).map(s => s.avg_hr)
    const avgHrGroup = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null

    // ── 4. ACWR médio do grupo ─────────────────────────────────────
    const acwrRows = await db
      .select({ acwr: weekly_indices.acwr })
      .from(weekly_indices)
      .innerJoin(athlete_profiles, eq(athlete_profiles.user_id, weekly_indices.athlete_id))
      .where(
        and(
          eq(weekly_indices.week_start, weekStart.toISOString().slice(0, 10)),
          role === 'coach'
            ? eq(athlete_profiles.coach_id, coach_id)
            : eq(weekly_indices.tenant_id, tenant_id),
          sql`${weekly_indices.acwr} IS NOT NULL`
        )
      )
    const acwrValues = acwrRows.map(r => Number(r.acwr)).filter(v => v > 0)
    const avgACWR = acwrValues.length > 0
      ? parseFloat((acwrValues.reduce((a, b) => a + b, 0) / acwrValues.length).toFixed(2))
      : null

    // ── 5. Alertas ACWR ───────────────────────────────────────────
    const alerts = []
    const riskyACWR = await db
      .select({ name: users.name, acwr: weekly_indices.acwr })
      .from(weekly_indices)
      .innerJoin(users, eq(users.id, weekly_indices.athlete_id))
      .innerJoin(athlete_profiles, eq(athlete_profiles.user_id, weekly_indices.athlete_id))
      .where(
        and(
          eq(weekly_indices.week_start, weekStart.toISOString().slice(0, 10)),
          role === 'coach' ? eq(athlete_profiles.coach_id, coach_id) : eq(weekly_indices.tenant_id, tenant_id),
          sql`${weekly_indices.acwr} >= 1.5`
        )
      )
      .limit(5)

    riskyACWR.forEach(r => {
      alerts.push({
        athlete: r.name,
        message: `ACWR = ${Number(r.acwr).toFixed(1)} — reduzir carga`,
        severity: r.acwr >= 1.7 ? 'error' : 'warning',
        time: 'esta semana',
      })
    })

    // ── 6. Top atletas da semana ───────────────────────────────────
    const sessionIdsThisWeek = await db
      .select({ id: training_sessions.id })
      .from(training_sessions)
      .where(
        and(
          eq(training_sessions.coach_id, coach_id),
          gte(training_sessions.start_datetime, weekStart)
        )
      )
    const weeklySessionIds = sessionIdsThisWeek.map(s => s.id)

    let topAthletes = []
    if (weeklySessionIds.length > 0) {
      const topRaw = await db
        .select({
          athlete_id: session_athletes.athlete_id,
          name: users.name,
          calories: sum(session_athletes.calories),
          sessions: count(),
        })
        .from(session_athletes)
        .innerJoin(users, eq(users.id, session_athletes.athlete_id))
        .where(inArray(session_athletes.session_id, weeklySessionIds))
        .groupBy(session_athletes.athlete_id, users.name)
        .orderBy(sql`SUM(${session_athletes.calories}) DESC`)
        .limit(5)

      topAthletes = topRaw.map(a => ({
        name: a.name,
        avatar: a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        calories: Number(a.calories || 0),
        sessions: Number(a.sessions || 0),
        zone: 3,
      }))
    }

    return NextResponse.json({
      stats: {
        activeAthletes: Number(athleteCount?.total || 0),
        sessionsToday: sessionsToday.length,
        activeSessions,
        avgHrGroup,
        avgACWR,
      },
      sessionsToday,
      alerts,
      avgACWR,
      topAthletes,
    })
  } catch (err) {
    console.error('[dashboard/coach]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
