import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import {
  users, coach_profiles, training_sessions, session_athletes,
  session_hr_series, athlete_profiles, sensors, daily_logs, weekly_indices
} from '@/lib/db/schema/index.js'
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coaches/[id]
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), or(eq(users.role, 'coach'), eq(users.role, 'academy_coach'))))
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Coach não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const [profile] = await db.select().from(coach_profiles).where(eq(coach_profiles.user_id, id)).limit(1)

    const recentSessions = await db
      .select({
        id:                 training_sessions.id,
        name:               training_sessions.name,
        start_datetime:     training_sessions.start_datetime,
        duration_min:       training_sessions.duration_min,
        status:             training_sessions.status,
        avg_hr:             training_sessions.avg_hr,
        participants_count: training_sessions.participants_count,
        target_zone_min:    training_sessions.target_zone_min,
        target_zone_max:    training_sessions.target_zone_max,
      })
      .from(training_sessions)
      .where(eq(training_sessions.coach_id, id))
      .orderBy(desc(training_sessions.start_datetime))
      .limit(10)

    const [[{ total_sessions }], [{ total_athletes }]] = await Promise.all([
      db.select({ total_sessions: sql`COUNT(*)` })
        .from(training_sessions).where(eq(training_sessions.coach_id, id)),
      db.select({ total_athletes: sql`COUNT(DISTINCT ${session_athletes.athlete_id})` })
        .from(session_athletes)
        .innerJoin(training_sessions, eq(session_athletes.session_id, training_sessions.id))
        .where(eq(training_sessions.coach_id, id)),
    ])

    const { password_hash, ...safeUser } = user
    return NextResponse.json({
      ...safeUser,
      profile:         profile ?? null,
      recent_sessions: recentSessions,
      stats: { total_sessions: Number(total_sessions), total_athletes: Number(total_athletes) },
    })
  } catch (err) {
    console.error('[GET /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/coaches/[id]
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params

  try {
    const body = await req.json()
    const { name, email, password, phone, is_active, role, cref, specialties, bio, birthdate, document, gender } = body

    const userUpdate = {}
    if (name      != null)       userUpdate.name         = name
    if (email     != null)       userUpdate.email        = email
    if (phone     !== undefined) userUpdate.phone        = phone
    if (birthdate !== undefined) userUpdate.birthdate    = birthdate || null
    if (document  !== undefined) userUpdate.document     = document
    if (gender    !== undefined) userUpdate.gender       = gender || null
    if (is_active !== undefined) userUpdate.is_active    = is_active ? 1 : 0
    if (role && ['coach', 'academy_coach'].includes(role)) userUpdate.role = role
    if (password) userUpdate.password_hash = await bcrypt.hash(password, 10)

    if (Object.keys(userUpdate).length > 0)
      await db.update(users).set(userUpdate).where(eq(users.id, id))

    const profileUpdate = {}
    if (cref        !== undefined) profileUpdate.cref        = cref
    if (specialties !== undefined) profileUpdate.specialties = specialties
    if (bio         !== undefined) profileUpdate.bio         = bio

    if (Object.keys(profileUpdate).length > 0) {
      const [existing] = await db.select({ id: coach_profiles.id }).from(coach_profiles).where(eq(coach_profiles.user_id, id)).limit(1)
      if (existing) {
        await db.update(coach_profiles).set(profileUpdate).where(eq(coach_profiles.user_id, id))
      } else {
        await db.insert(coach_profiles).values({ id: randomUUID(), user_id: id, ...profileUpdate })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/coaches/[id]
// Hard delete em cascata:
//   session_hr_series → session_athletes → training_sessions
//   → coach_profiles → users
// Query param: ?backup=1 (reservado para implementação futura)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const withBackup = searchParams.get('backup') === '1'

  try {
    const [user] = await db.select({ id: users.id, name: users.name, role: users.role, tenant_id: users.tenant_id })
      .from(users).where(eq(users.id, id)).limit(1)

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    if (withBackup) {
      console.log(`[DELETE /api/coaches/${id}] Backup solicitado antes da exclusão de "${user.name}" — implementação pendente`)
    }

    // 1. Busca todas as training_sessions deste coach
    const coachSessions = await db
      .select({ id: training_sessions.id })
      .from(training_sessions)
      .where(eq(training_sessions.coach_id, id))

    if (coachSessions.length > 0) {
      const sessionIds = coachSessions.map(s => s.id)
      // 2. Deleta série de FC de todas as sessões
      await db.delete(session_hr_series).where(inArray(session_hr_series.session_id, sessionIds))
      // 3. Deleta participações de atletas nessas sessões
      await db.delete(session_athletes).where(inArray(session_athletes.session_id, sessionIds))
      // 4. Deleta as próprias sessões
      await db.delete(training_sessions).where(eq(training_sessions.coach_id, id))
    }

    // 5. Deleta perfil do coach
    await db.delete(coach_profiles).where(eq(coach_profiles.user_id, id))
    // 6. Deleta o usuário
    await db.delete(users).where(eq(users.id, id))

    return NextResponse.json({
      message: 'Treinador excluído permanentemente do banco de dados',
      backup_requested: withBackup,
    })
  } catch (err) {
    console.error('[DELETE /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
