import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles, sensors, daily_logs, weekly_indices, session_athletes, training_sessions } from '@/lib/db/schema/index.js'
import { eq, and, or, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Todos os roles que representam um atleta no sistema
const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']
const isAthleteRole = col => or(...ATHLETE_ROLES.map(r => eq(col, r)))

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/athletes/[id] — perfil completo
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const [user] = await db.select().from(users)
      .where(and(eq(users.id, id), isAthleteRole(users.role)))
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

    // Controle de acesso por role:
    // - super_admin: vê qualquer atleta
    // - coach: vê apenas coach_athlete vinculado ao seu tenant_id (ou sem tenant)
    // - tenant_admin / academy_coach / receptionist: vêm apenas do mesmo tenant
    if (session.user.role !== 'super_admin') {
      if (session.user.role === 'coach') {
        // coach vê apenas coach_athlete (tenant_id null ou mesmo tenant)
        if (user.role !== 'coach_athlete')
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      } else {
        // demais staff: mesmo tenant
        if (session.user.tenant_id !== user.tenant_id)
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    const [profile]      = await db.select().from(athlete_profiles).where(eq(athlete_profiles.user_id, id)).limit(1)
    const [sensor]       = await db.select().from(sensors).where(eq(sensors.athlete_id, id)).limit(1)
    const logs           = await db.select().from(daily_logs).where(eq(daily_logs.athlete_id, id)).orderBy(desc(daily_logs.log_date)).limit(7)
    const [acwr]         = await db.select().from(weekly_indices).where(eq(weekly_indices.athlete_id, id)).orderBy(desc(weekly_indices.week_start)).limit(1)

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

    const { password_hash, ...safeUser } = user
    return NextResponse.json({
      ...safeUser,
      profile:         profile         ?? null,
      sensor:          sensor          ?? null,
      recent_logs:     logs,
      acwr:            acwr            ?? null,
      recent_sessions: recentSessions,
    })

  } catch (error) {
    console.error('[GET /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/athletes/[id] — atualizar dados do atleta
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const allowedRoles = ['super_admin', 'tenant_admin', 'coach']
    if (!allowedRoles.includes(session.user.role))
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { id } = await params
    const body   = await request.json()

    const [user] = await db.select().from(users)
      .where(and(eq(users.id, id), isAthleteRole(users.role)))
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const userUpdate = {}
    if (body.name)       userUpdate.name        = body.name.trim()
    if (body.phone)      userUpdate.phone       = body.phone
    if (body.gender)     userUpdate.gender      = body.gender
    if (body.birthdate)  userUpdate.birthdate   = body.birthdate
    if (body.document)   userUpdate.document    = body.document
    if (body.avatar_url) userUpdate.avatar_url  = body.avatar_url
    if (body.password)   userUpdate.password_hash = await bcrypt.hash(body.password, 10)

    if (Object.keys(userUpdate).length > 0)
      await db.update(users).set(userUpdate).where(eq(users.id, id))

    const profileUpdate = {}
    const profileFields = [
      'hr_max','hr_rest','hr_threshold','weight_kg','height_cm',
      'body_fat_pct','goal','medical_notes','emergency_contact',
      'emergency_phone','zone1_max','zone2_max','zone3_max','zone4_max',
      'plan_id','enrollment_date','status',
    ]
    for (const field of profileFields) {
      if (body[field] !== undefined) profileUpdate[field] = body[field]
    }
    if (body.hr_max && !body.zone1_max) {
      const hm = parseInt(body.hr_max)
      profileUpdate.zone1_max = Math.round(hm * 0.60)
      profileUpdate.zone2_max = Math.round(hm * 0.70)
      profileUpdate.zone3_max = Math.round(hm * 0.80)
      profileUpdate.zone4_max = Math.round(hm * 0.90)
    }
    if (Object.keys(profileUpdate).length > 0)
      await db.update(athlete_profiles).set(profileUpdate).where(eq(athlete_profiles.user_id, id))

    return NextResponse.json({ message: 'Atleta atualizado com sucesso' })

  } catch (error) {
    console.error('[PUT /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/athletes/[id] — inativar atleta (soft delete)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const allowedRoles = ['super_admin', 'tenant_admin', 'coach']
    if (!allowedRoles.includes(session.user.role))
      return NextResponse.json({ error: 'Acesso negado — apenas admin pode inativar atletas' }, { status: 403 })

    const { id } = await params

    const [user] = await db.select().from(users)
      .where(and(eq(users.id, id), isAthleteRole(users.role)))
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    await db.update(users).set({ is_active: 0 }).where(eq(users.id, id))
    await db.update(athlete_profiles).set({ status: 'inactive' }).where(eq(athlete_profiles.user_id, id))

    return NextResponse.json({ message: 'Atleta inativado com sucesso' })

  } catch (error) {
    console.error('[DELETE /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
