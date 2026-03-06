import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, coach_profiles, training_sessions, session_athletes } from '@/lib/db/schema/index.js'
import { eq, and, or, desc, sql } from 'drizzle-orm'
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
      .where(
        and(
          eq(users.id, id),
          or(eq(users.role, 'coach'), eq(users.role, 'academy_coach'))
        )
      )
      .limit(1)

    if (!user) return NextResponse.json({ error: 'Coach não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== user.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const [profile] = await db
      .select()
      .from(coach_profiles)
      .where(eq(coach_profiles.user_id, id))
      .limit(1)

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
        .from(training_sessions)
        .where(eq(training_sessions.coach_id, id)),
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
      stats: {
        total_sessions: Number(total_sessions),
        total_athletes: Number(total_athletes),
      },
    })
  } catch (err) {
    console.error('[GET /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/coaches/[id]
// updated_at é gerenciado automaticamente pelo MySQL (onUpdateNow)
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
    const { name, email, password, specialty, phone, is_active, role, cref, specialties, bio, birthdate, document, gender } = body

    // Monta objeto de update apenas com campos presentes (sem updated_at — MySQL gerencia via onUpdateNow)
    const userUpdate = {}
    if (name      != null) userUpdate.name       = name
    if (email     != null) userUpdate.email      = email
    if (phone     !== undefined) userUpdate.phone      = phone
    if (birthdate !== undefined) userUpdate.birthdate  = birthdate || null
    if (document  !== undefined) userUpdate.document   = document
    if (gender    !== undefined) userUpdate.gender     = gender || null
    if (is_active !== undefined) userUpdate.is_active  = is_active ? 1 : 0
    if (role && ['coach', 'academy_coach'].includes(role)) userUpdate.role = role
    if (password)               userUpdate.password_hash = await bcrypt.hash(password, 10)

    if (Object.keys(userUpdate).length > 0)
      await db.update(users).set(userUpdate).where(eq(users.id, id))

    // Upsert coach_profiles
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
// DELETE /api/coaches/[id] — soft delete
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params

  try {
    await db.update(users).set({ is_active: 0 }).where(eq(users.id, id))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
