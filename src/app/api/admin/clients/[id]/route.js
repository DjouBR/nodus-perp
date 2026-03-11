import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import {
  users, tenants, coach_profiles, athlete_profiles, sensors,
  daily_logs, weekly_indices, session_athletes, training_sessions, session_hr_series
} from '@/lib/db/schema/index.js'
import { eq, inArray } from 'drizzle-orm'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const [user] = await db.select().from(users)
      .leftJoin(tenants, eq(users.tenant_id, tenants.id))
      .where(eq(users.id, id))

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let profile = null
    if (['coach', 'academy_coach'].includes(user.users.role)) {
      const [cp] = await db.select().from(coach_profiles).where(eq(coach_profiles.user_id, id))
      profile = cp ?? null
    } else if (['athlete', 'academy_athlete', 'coach_athlete'].includes(user.users.role)) {
      const [ap] = await db.select().from(athlete_profiles).where(eq(athlete_profiles.user_id, id))
      profile = ap ?? null
    }

    return NextResponse.json({ ...user.users, tenant: user.tenants, profile })
  } catch (err) {
    console.error('[GET /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const body = await request.json()
    const { name, email, phone, document, birthdate, gender, is_active, role } = body

    const updateData = {}
    if (name      != null) updateData.name      = name
    if (email     != null) updateData.email     = email
    if (phone     != null) updateData.phone     = phone
    if (document  != null) updateData.document  = document
    if (birthdate != null) updateData.birthdate = birthdate || null
    if (gender    != null) updateData.gender    = gender || null
    if (is_active != null) updateData.is_active = is_active ? 1 : 0
    if (role      != null) updateData.role      = role

    if (Object.keys(updateData).length > 0)
      await db.update(users).set(updateData).where(eq(users.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/clients/[id]
// Hard delete inteligente baseado no role do usuário:
//
//   COACH / ACADEMY_COACH:
//     session_hr_series → session_athletes → training_sessions → coach_profiles → users
//
//   ATLETA (athlete / academy_athlete / coach_athlete):
//     session_athletes → daily_logs → weekly_indices → sensors → athlete_profiles → users
//
//   OUTROS (tenant_admin, receptionist, etc.):
//     apenas users
//
// Query param: ?backup=1 (reservado para implementação futura)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const withBackup = searchParams.get('backup') === '1'

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users).where(eq(users.id, id)).limit(1)

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (withBackup) {
      console.log(`[DELETE /api/admin/clients/${id}] Backup solicitado antes da exclusão de "${user.name}" (${user.role}) — implementação pendente`)
    }

    const COACH_ROLES   = ['coach', 'academy_coach']
    const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

    if (COACH_ROLES.includes(user.role)) {
      // Cascata coach
      const coachSessions = await db
        .select({ id: training_sessions.id })
        .from(training_sessions)
        .where(eq(training_sessions.coach_id, id))

      if (coachSessions.length > 0) {
        const sessionIds = coachSessions.map(s => s.id)
        await db.delete(session_hr_series).where(inArray(session_hr_series.session_id, sessionIds))
        await db.delete(session_athletes).where(inArray(session_athletes.session_id, sessionIds))
        await db.delete(training_sessions).where(eq(training_sessions.coach_id, id))
      }
      await db.delete(coach_profiles).where(eq(coach_profiles.user_id, id))

    } else if (ATHLETE_ROLES.includes(user.role)) {
      // Cascata atleta
      await db.delete(session_athletes).where(eq(session_athletes.athlete_id, id))
      await db.delete(daily_logs).where(eq(daily_logs.athlete_id, id))
      await db.delete(weekly_indices).where(eq(weekly_indices.athlete_id, id))
      await db.delete(sensors).where(eq(sensors.athlete_id, id))
      await db.delete(athlete_profiles).where(eq(athlete_profiles.user_id, id))
    }
    // Qualquer outro role (tenant_admin, receptionist): apaga apenas o user

    await db.delete(users).where(eq(users.id, id))

    return NextResponse.json({
      message: `Usuário "${user.name}" excluído permanentemente do banco de dados`,
      role: user.role,
      backup_requested: withBackup,
    })
  } catch (err) {
    console.error('[DELETE /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
