import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles, sensors } from '@/lib/db/schema/index.js'
import { eq, and, or, like, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// Roles considerados "atleta" no sistema (todos os 3 tipos)
const ATHLETE_ROLES = ['academy_athlete', 'coach_athlete', 'athlete']

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/athletes
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const allowedRoles = ['super_admin', 'tenant_admin', 'coach', 'academy_coach', 'receptionist']
    if (!allowedRoles.includes(session.user.role))
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1'))
    const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '20'))
    const search  = searchParams.get('search') ?? ''
    const status  = searchParams.get('status') ?? ''
    const offset  = (page - 1) * perPage

    const conditions = []

    // Filtro de roles por quem acessa:
    // - tenant_admin / academy_coach / receptionist → vêem apenas academy_athlete
    // - coach → vê apenas coach_athlete que ele mesmo cadastrou (via coach_id no profile)
    // - super_admin → vê todos os tipos de atleta
    if (session.user.role === 'super_admin') {
      conditions.push(
        or(
          eq(users.role, 'academy_athlete'),
          eq(users.role, 'coach_athlete'),
          eq(users.role, 'athlete')
        )
      )
    } else if (session.user.role === 'coach') {
      conditions.push(eq(users.role, 'coach_athlete'))
    } else {
      // tenant_admin, academy_coach, receptionist
      conditions.push(eq(users.role, 'academy_athlete'))
    }

    // Isolamento por tenant (super_admin vê todos)
    if (session.user.role !== 'super_admin' && session.user.tenant_id)
      conditions.push(eq(users.tenant_id, session.user.tenant_id))

    if (search)
      conditions.push(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)))

    // Filtro de status via athlete_profiles
    if (status) {
      const profileRows = await db
        .select({ user_id: athlete_profiles.user_id })
        .from(athlete_profiles)
        .where(eq(athlete_profiles.status, status))
      const filteredAthleteIds = profileRows.map(r => r.user_id)
      if (filteredAthleteIds.length === 0)
        return NextResponse.json({ data: [], total: 0, page, perPage, totalPages: 0 })
      conditions.push(
        sql`${users.id} IN (${sql.join(filteredAthleteIds.map(id => sql`${id}`), sql`, `)})`
      )
    }

    const whereClause = and(...conditions)

    const [totalRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(users)
      .where(whereClause)

    const total      = Number(totalRow?.count ?? 0)
    const totalPages = Math.ceil(total / perPage)

    const athleteRows = await db
      .select({
        id: users.id, name: users.name, email: users.email,
        role: users.role,
        phone: users.phone, gender: users.gender, birthdate: users.birthdate,
        avatar_url: users.avatar_url, is_active: users.is_active,
        tenant_id: users.tenant_id, unit_id: users.unit_id, created_at: users.created_at,
      })
      .from(users)
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(users.name)

    if (athleteRows.length === 0)
      return NextResponse.json({ data: [], total, page, perPage, totalPages })

    const ids = athleteRows.map(a => a.id)

    const profiles   = await db.select().from(athlete_profiles)
      .where(sql`${athlete_profiles.user_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
    const sensorList = await db.select().from(sensors)
      .where(sql`${sensors.athlete_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)

    const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]))
    const sensorMap  = Object.fromEntries(sensorList.map(s => [s.athlete_id, s]))

    const data = athleteRows.map(a => ({
      ...a,
      profile: profileMap[a.id] ?? null,
      sensor:  sensorMap[a.id]  ?? null,
    }))

    return NextResponse.json({ data, total, page, perPage, totalPages })

  } catch (error) {
    console.error('[GET /api/athletes]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/athletes
// Role atribuído automaticamente com base em quem cadastra:
//   tenant_admin / academy_coach → academy_athlete
//   coach                        → coach_athlete
//   super_admin                  → usa targetRole do body (academy_athlete | coach_athlete | athlete)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const allowedRoles = ['super_admin', 'tenant_admin', 'coach', 'academy_coach']
    if (!allowedRoles.includes(session.user.role))
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const body = await request.json()

    const errors = []
    if (!body.name?.trim())  errors.push('Nome é obrigatório')
    if (!body.email?.trim()) errors.push('Email é obrigatório')
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      errors.push('Email inválido')
    if (errors.length > 0)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, body.email.toLowerCase().trim()))
      .limit(1)

    if (existing) {
      const roleLabel = {
        athlete: 'um atleta independente', coach_athlete: 'um aluno de treinador',
        academy_athlete: 'um aluno de academia',
        coach: 'um coach', academy_coach: 'um professor',
        tenant_admin: 'um administrador', receptionist: 'um recepcionista',
      }
      return NextResponse.json(
        { error: `Email já cadastrado como ${roleLabel[existing.role] ?? 'outro usuário'}` },
        { status: 409 }
      )
    }

    // Determina o role do atleta automaticamente
    let athleteRole
    if (session.user.role === 'super_admin') {
      const validTargetRoles = ['academy_athlete', 'coach_athlete', 'athlete']
      athleteRole = validTargetRoles.includes(body.targetRole) ? body.targetRole : 'athlete'
    } else if (['tenant_admin', 'academy_coach'].includes(session.user.role)) {
      athleteRole = 'academy_athlete'
    } else if (session.user.role === 'coach') {
      athleteRole = 'coach_athlete'
    }

    const userId   = randomUUID()
    const password = body.password ?? 'nodus@123'
    const pwdHash  = await bcrypt.hash(password, 10)
    const tenantId = session.user.role === 'super_admin'
      ? (body.tenant_id ?? null)
      : session.user.tenant_id

    // coach_id para vincular coach_athlete ao seu coach
    const coachId = session.user.role === 'coach' ? session.user.id : null

    await db.insert(users).values({
      id:             userId,
      tenant_id:      tenantId,
      unit_id:        session.user.unit_id ?? body.unit_id ?? null,
      name:           body.name.trim(),
      email:          body.email.toLowerCase().trim(),
      password_hash:  pwdHash,
      role:           athleteRole,
      phone:          body.phone    ?? null,
      gender:         body.gender   ?? null,
      birthdate:      body.birthdate ?? null,
      document:       body.document ?? null,
      is_active:      1,
      email_verified: 0,
    })

    const hrMax = body.hr_max ? parseInt(body.hr_max) : null

    await db.insert(athlete_profiles).values({
      id:                randomUUID(),
      user_id:           userId,
      coach_id:          coachId,
      hr_max:            hrMax,
      hr_rest:           body.hr_rest      ? parseInt(body.hr_rest)      : null,
      hr_threshold:      body.hr_threshold ? parseInt(body.hr_threshold) : null,
      weight_kg:         body.weight_kg    ? String(body.weight_kg)      : null,
      height_cm:         body.height_cm    ? String(body.height_cm)      : null,
      body_fat_pct:      body.body_fat_pct ? String(body.body_fat_pct)   : null,
      goal:              body.goal              ?? null,
      medical_notes:     body.medical_notes     ?? null,
      emergency_contact: body.emergency_contact ?? null,
      emergency_phone:   body.emergency_phone   ?? null,
      enrollment_date:   new Date().toISOString().split('T')[0],
      status:            'active',
      zone1_max: hrMax ? Math.round(hrMax * 0.60) : null,
      zone2_max: hrMax ? Math.round(hrMax * 0.70) : null,
      zone3_max: hrMax ? Math.round(hrMax * 0.80) : null,
      zone4_max: hrMax ? Math.round(hrMax * 0.90) : null,
    })

    return NextResponse.json({
      message: 'Atleta criado com sucesso',
      athleteRole,
      default_password: body.password ? undefined : 'nodus@123',
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/athletes]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
