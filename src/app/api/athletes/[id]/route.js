import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles, sensors, daily_logs, weekly_indices, session_athletes, training_sessions, session_types } from '@/lib/db/schema/index.js'
import { eq, and, or, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']
const isAthleteRole = col => or(...ATHLETE_ROLES.map(r => eq(col, r)))

// Converte '', undefined, null → null (protege colunas int/float/date do MySQL)
const nullify = v => (v === '' || v === undefined || v === null) ? null : v
// Para int/float: null ou número válido; string vazia → null
const nullifyNum = v => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/athletes/[id]
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

    if (session.user.role !== 'super_admin') {
      if (session.user.role === 'coach') {
        if (user.role !== 'coach_athlete')
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      } else {
        if (session.user.tenant_id !== user.tenant_id)
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    const [profile]      = await db.select().from(athlete_profiles).where(eq(athlete_profiles.user_id, id)).limit(1)
    const [sensor]       = await db.select().from(sensors).where(eq(sensors.athlete_id, id)).limit(1)
    const logs           = await db.select().from(daily_logs).where(eq(daily_logs.athlete_id, id)).orderBy(desc(daily_logs.log_date)).limit(7)
    const [acwr]         = await db.select().from(weekly_indices).where(eq(weekly_indices.athlete_id, id)).orderBy(desc(weekly_indices.week_start)).limit(1)

    // Busca sessões em que o atleta participou (checked_in = 1)
    // Inclui dados de desempenho + nome do tipo de sessão
    const recentSessions = await db
      .select({
        session_id:      session_athletes.session_id,
        checked_in:      session_athletes.checked_in,
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
        end_datetime:    training_sessions.end_datetime,
        duration_min:    training_sessions.duration_min,
        status:          training_sessions.status,
        session_type_id: training_sessions.session_type_id,
        type_name:       session_types.name,
        type_color:      session_types.color,
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(session_athletes.session_id, training_sessions.id))
      .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
      .where(and(
        eq(session_athletes.athlete_id, id),
        eq(session_athletes.checked_in, 1),
      ))
      .orderBy(desc(training_sessions.start_datetime))
      .limit(20)

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
// PUT /api/athletes/[id]
// Usa nullify() para strings e nullifyNum() para int/float
// Garante que '' nunca vá para colunas numéricas do MySQL
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

    // ── campos da tabela users ──────────────────────────────────────
    const userUpdate = {}
    if (body.name      !== undefined) userUpdate.name         = body.name?.trim() || null
    if (body.phone     !== undefined) userUpdate.phone        = nullify(body.phone)
    if (body.gender    !== undefined) userUpdate.gender       = nullify(body.gender)
    if (body.birthdate !== undefined) userUpdate.birthdate    = nullify(body.birthdate)
    if (body.document  !== undefined) userUpdate.document     = nullify(body.document)
    if (body.avatar_url !== undefined) userUpdate.avatar_url  = nullify(body.avatar_url)
    if (body.is_active !== undefined) userUpdate.is_active    = body.is_active ? 1 : 0
    if (body.password)                userUpdate.password_hash = await bcrypt.hash(body.password, 10)

    if (Object.keys(userUpdate).length > 0)
      await db.update(users).set(userUpdate).where(eq(users.id, id))

    // ── campos da tabela athlete_profiles ──────────────────────────
    const numFields  = ['hr_max','hr_rest','hr_threshold','weight_kg','height_cm','body_fat_pct',
                        'zone1_max','zone2_max','zone3_max','zone4_max']
    const textFields = ['goal','medical_notes','emergency_contact','emergency_phone',
                        'plan_id','enrollment_date','status']

    const profileUpdate = {}
    for (const f of numFields)  { if (body[f] !== undefined) profileUpdate[f] = nullifyNum(body[f]) }
    for (const f of textFields) { if (body[f] !== undefined) profileUpdate[f] = nullify(body[f]) }

    if (body.hr_max && !body.zone1_max) {
      const hm = parseInt(body.hr_max)
      if (!isNaN(hm) && hm > 0) {
        profileUpdate.zone1_max = Math.round(hm * 0.60)
        profileUpdate.zone2_max = Math.round(hm * 0.70)
        profileUpdate.zone3_max = Math.round(hm * 0.80)
        profileUpdate.zone4_max = Math.round(hm * 0.90)
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const [existingProfile] = await db.select({ user_id: athlete_profiles.user_id })
        .from(athlete_profiles).where(eq(athlete_profiles.user_id, id)).limit(1)

      if (existingProfile) {
        await db.update(athlete_profiles).set(profileUpdate).where(eq(athlete_profiles.user_id, id))
      } else {
        const { randomUUID } = await import('crypto')
        await db.insert(athlete_profiles).values({
          id: randomUUID(),
          user_id: id,
          tenant_id: user.tenant_id,
          ...profileUpdate,
        })
      }
    }

    return NextResponse.json({ message: 'Atleta atualizado com sucesso' })

  } catch (error) {
    console.error('[PUT /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/athletes/[id] — hard delete em cascata
// session_athletes → daily_logs → weekly_indices → sensors → athlete_profiles → users
// Query param: ?backup=1 (reservado para implementação futura)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const allowedRoles = ['super_admin', 'tenant_admin', 'coach']
    if (!allowedRoles.includes(session.user.role))
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const withBackup = searchParams.get('backup') === '1'

    const [user] = await db.select().from(users)
      .where(and(eq(users.id, id), isAthleteRole(users.role)))
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    if (withBackup) {
      console.log(`[DELETE /api/athletes/${id}] Backup solicitado — "${user.name}" — implementação pendente`)
    }

    await db.delete(session_athletes).where(eq(session_athletes.athlete_id, id))
    await db.delete(daily_logs).where(eq(daily_logs.athlete_id, id))
    await db.delete(weekly_indices).where(eq(weekly_indices.athlete_id, id))
    await db.delete(sensors).where(eq(sensors.athlete_id, id))
    await db.delete(athlete_profiles).where(eq(athlete_profiles.user_id, id))
    await db.delete(users).where(eq(users.id, id))

    return NextResponse.json({
      message: 'Atleta excluído permanentemente do banco de dados',
      backup_requested: withBackup,
    })

  } catch (error) {
    console.error('[DELETE /api/athletes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
