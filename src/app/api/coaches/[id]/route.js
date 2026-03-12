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
    if (phone     !== undefined) userUpdate.phone        = phone || null
    if (birthdate !== undefined) userUpdate.birthdate    = birthdate || null
    if (document  !== undefined) userUpdate.document     = document || null
    if (gender    !== undefined) userUpdate.gender       = gender || null
    if (is_active !== undefined) userUpdate.is_active    = is_active ? 1 : 0
    if (role && ['coach', 'academy_coach'].includes(role)) userUpdate.role = role
    if (password) userUpdate.password_hash = await bcrypt.hash(password, 10)

    if (Object.keys(userUpdate).length > 0)
      await db.update(users).set(userUpdate).where(eq(users.id, id))

    const profileUpdate = {}
    if (cref        !== undefined) profileUpdate.cref        = cref || null
    if (specialties !== undefined) profileUpdate.specialties = specialties || null
    if (bio         !== undefined) profileUpdate.bio         = bio || null

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
//
// Fase 1 — Fluxo LGPD de pending_deletion (30 dias):
//   1. Hard delete imediato das sessões e dados operacionais do coach
//      (session_hr_series → session_athletes → training_sessions → coach_profiles)
//   2. coach_athletes vinculados ficam com:
//      - is_active = 0  (acesso bloqueado)
//      - athlete_profiles.status = 'pending_deletion'
//      - athlete_profiles.deletion_scheduled_at = NOW() + 30 dias
//   3. O próprio usuário coach é excluído permanentemente
//
// TODO Fase 2 — ao criar o registro pending_deletion:
//   - Disparar notificação WhatsApp/email ao aluno com link de exportação
//   - Link de oferta: migrar para plano "Atleta Independente" (role=athlete)
//   - Cron job diário: verificar deletion_scheduled_at expirado → hard delete em cascata
//
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
    const [coach] = await db
      .select({ id: users.id, name: users.name, role: users.role, tenant_id: users.tenant_id })
      .from(users).where(eq(users.id, id)).limit(1)

    if (!coach) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (session.user.role !== 'super_admin' && session.user.tenant_id !== coach.tenant_id)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    if (withBackup) {
      console.log(`[DELETE /api/coaches/${id}] Backup solicitado — "${coach.name}" — implementação pendente`)
    }

    // ── 1. Hard delete das sessões do coach ───────────────────────────
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

    // ── 2. Marca coach_athletes vinculados como pending_deletion ──────
    // Busca todos os coach_athlete vinculados a este coach via coach_profiles.coach_id
    // (campo coach_id em athlete_profiles referencia o coach responsável)
    const linkedAthletes = await db
      .select({ user_id: athlete_profiles.user_id })
      .from(athlete_profiles)
      .where(eq(athlete_profiles.coach_id, id))

    if (linkedAthletes.length > 0) {
      const athleteIds = linkedAthletes.map(a => a.user_id)

      // Calcula data de expiração: hoje + 30 dias
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      const expiresDateStr = expiresAt.toISOString().slice(0, 10) // 'YYYY-MM-DD'

      // Bloqueia acesso imediatamente
      await db.update(users)
        .set({ is_active: 0 })
        .where(inArray(users.id, athleteIds))

      // Marca perfil com status e data de expiração
      // TODO Fase 2: disparar notificação (WhatsApp/email) para cada atleta
      await db.update(athlete_profiles)
        .set({
          status: 'pending_deletion',
          deletion_scheduled_at: expiresDateStr,
        })
        .where(inArray(athlete_profiles.user_id, athleteIds))

      console.log(
        `[DELETE coach ${id}] ${linkedAthletes.length} atleta(s) marcado(s) como pending_deletion até ${expiresDateStr}`,
        `IDs: ${athleteIds.join(', ')}`
      )
    }

    // ── 3. Exclui perfil e usuário do coach ───────────────────────────
    await db.delete(coach_profiles).where(eq(coach_profiles.user_id, id))
    await db.delete(users).where(eq(users.id, id))

    return NextResponse.json({
      message: 'Treinador excluído permanentemente do banco de dados',
      athletes_pending_deletion: linkedAthletes.length,
      backup_requested: withBackup,
    })
  } catch (err) {
    console.error('[DELETE /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
