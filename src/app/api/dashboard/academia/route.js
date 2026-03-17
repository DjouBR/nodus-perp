import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { weekly_indices } from '@/lib/db/schema/training'
import { eq, and, gte, lte, sql, count, avg, sum, inArray } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, tenant_id } = session.user
  if (!['tenant_admin', 'academy_coach', 'receptionist', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenantFilter = role === 'super_admin' ? {} : { tenant_id }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // Início da semana atual (segunda-feira)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  try {
    // ── 1. Atletas ativos ──────────────────────────────────────────
    const [athleteStats] = await db
      .select({ total: count(), newThisMonth: sql`SUM(CASE WHEN ${users.created_at} >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END)` })
      .from(users)
      .innerJoin(athlete_profiles, eq(athlete_profiles.user_id, users.id))
      .where(
        and(
          role === 'super_admin' ? undefined : eq(users.tenant_id, tenant_id),
          eq(users.is_active, 1),
          eq(athlete_profiles.status, 'active'),
          inArray(users.role, ['academy_athlete', 'coach_athlete', 'athlete'])
        )
      )

    // ── 2. Sessões de hoje ─────────────────────────────────────────
    const todaySessions = await db
      .select({
        id: training_sessions.id,
        name: training_sessions.name,
        start_datetime: training_sessions.start_datetime,
        status: training_sessions.status,
        participants_count: training_sessions.participants_count,
        avg_hr: training_sessions.avg_hr,
        coach_id: training_sessions.coach_id,
      })
      .from(training_sessions)
      .where(
        and(
          role === 'super_admin' ? undefined : eq(training_sessions.tenant_id, tenant_id),
          gte(training_sessions.start_datetime, today),
          lte(training_sessions.start_datetime, todayEnd)
        )
      )
      .orderBy(training_sessions.start_datetime)

    // Busca nomes dos coaches das sessões de hoje
    const coachIds = [...new Set(todaySessions.map(s => s.coach_id).filter(Boolean))]
    const coaches = coachIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, coachIds))
      : []
    const coachMap = Object.fromEntries(coaches.map(c => [c.id, c.name]))

    const sessionsToday = todaySessions.map(s => ({
      ...s,
      coach: coachMap[s.coach_id] || '—',
      time: s.start_datetime ? new Date(s.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
    }))

    const activeSessions = sessionsToday.filter(s => s.status === 'active').length

    // ── 3. FC média hoje (sessões de hoje com avg_hr preenchido) ───
    const hrValues = sessionsToday.filter(s => s.avg_hr).map(s => s.avg_hr)
    const avgHrToday = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null

    // ── 4. Calorias totais hoje ────────────────────────────────────
    const sessionIdsToday = sessionsToday.map(s => s.id)
    let totalCaloriesToday = 0
    if (sessionIdsToday.length > 0) {
      const [calResult] = await db
        .select({ total: sum(session_athletes.calories) })
        .from(session_athletes)
        .where(inArray(session_athletes.session_id, sessionIdsToday))
      totalCaloriesToday = Number(calResult?.total || 0)
    }

    // ── 5. Alertas (ACWR alto + ausências prolongadas) ─────────────
    const alerts = []

    // Atletas com ACWR >= 1.5 na semana atual
    const riskyACWR = await db
      .select({
        athlete_id: weekly_indices.athlete_id,
        acwr: weekly_indices.acwr,
        name: users.name,
      })
      .from(weekly_indices)
      .innerJoin(users, eq(users.id, weekly_indices.athlete_id))
      .where(
        and(
          role === 'super_admin' ? undefined : eq(weekly_indices.tenant_id, tenant_id),
          eq(weekly_indices.week_start, weekStart.toISOString().slice(0, 10)),
          sql`${weekly_indices.acwr} >= 1.5`
        )
      )
      .limit(5)

    riskyACWR.forEach(r => {
      alerts.push({
        athlete: r.name,
        message: `ACWR = ${Number(r.acwr).toFixed(1)} — risco de lesão`,
        severity: r.acwr >= 1.7 ? 'error' : 'warning',
        time: 'esta semana',
      })
    })

    // ── 6. Zonas de FC (acumulado semanal via session_athletes) ───
    const sessionIdsThisWeek = await db
      .select({ id: training_sessions.id })
      .from(training_sessions)
      .where(
        and(
          role === 'super_admin' ? undefined : eq(training_sessions.tenant_id, tenant_id),
          gte(training_sessions.start_datetime, weekStart)
        )
      )

    const weeklySessionIds = sessionIdsThisWeek.map(s => s.id)
    let hrZones = [
      { zone: 'Z1 Repouso',  pct: 0, color: '#a8d8ea' },
      { zone: 'Z2 Aeróbico', pct: 0, color: '#4caf50' },
      { zone: 'Z3 Tempo',    pct: 0, color: '#ff9800' },
      { zone: 'Z4 Limiar',   pct: 0, color: '#f44336' },
      { zone: 'Z5 Máximo',   pct: 0, color: '#9c27b0' },
    ]

    if (weeklySessionIds.length > 0) {
      const [zoneData] = await db
        .select({
          z1: sum(session_athletes.time_z1_sec),
          z2: sum(session_athletes.time_z2_sec),
          z3: sum(session_athletes.time_z3_sec),
          z4: sum(session_athletes.time_z4_sec),
          z5: sum(session_athletes.time_z5_sec),
        })
        .from(session_athletes)
        .where(inArray(session_athletes.session_id, weeklySessionIds))

      const totals = [Number(zoneData?.z1||0), Number(zoneData?.z2||0), Number(zoneData?.z3||0), Number(zoneData?.z4||0), Number(zoneData?.z5||0)]
      const totalSec = totals.reduce((a, b) => a + b, 0)
      if (totalSec > 0) {
        hrZones = hrZones.map((z, i) => ({ ...z, pct: Math.round((totals[i] / totalSec) * 100) }))
      }
    }

    // ── 7. Presença semanal (seg–dom) ─────────────────────────────
    const weeklyPresence = []
    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const [res] = await db
        .select({ count: sql`COUNT(DISTINCT ${session_athletes.athlete_id})` })
        .from(session_athletes)
        .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
        .where(
          and(
            role === 'super_admin' ? undefined : eq(training_sessions.tenant_id, tenant_id),
            gte(training_sessions.start_datetime, day),
            lte(training_sessions.start_datetime, dayEnd)
          )
        )
      weeklyPresence.push({ day: dayNames[(i + 1) % 7], count: Number(res?.count || 0) })
    }

    // ── 8. Top atletas da semana ───────────────────────────────────
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
        activeAthletes: Number(athleteStats?.total || 0),
        newThisMonth: Number(athleteStats?.newThisMonth || 0),
        sessionsToday: sessionsToday.length,
        activeSessions,
        avgHrToday,
        totalCaloriesToday,
      },
      sessionsToday,
      alerts,
      hrZones,
      weeklyPresence,
      topAthletes,
    })
  } catch (err) {
    console.error('[dashboard/academia]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
