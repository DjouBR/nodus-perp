import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, coach_profiles } from '@/lib/db/schema/index.js'
import { eq, and, or, like, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const COACH_ROLES = ['coach', 'academy_coach']

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/coaches
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '10'))
  const search  = searchParams.get('search') ?? ''
  const type    = searchParams.get('type')   ?? ''
  const offset  = (page - 1) * perPage

  try {
    // Filtro base: coach OU academy_coach
    const roleFilter = (type && COACH_ROLES.includes(type))
      ? eq(users.role, type)
      : or(eq(users.role, 'coach'), eq(users.role, 'academy_coach'))

    const conditions = [roleFilter]

    if (session.user.role !== 'super_admin') {
      conditions.push(eq(users.tenant_id, session.user.tenant_id))
    }

    if (search) {
      conditions.push(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)))
    }

    const where = and(...conditions)

    const [data, [{ count }]] = await Promise.all([
      db.select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        role:       users.role,
        phone:      users.phone,
        avatar_url: users.avatar_url,
        is_active:  users.is_active,
        tenant_id:  users.tenant_id,
        created_at: users.created_at,
      })
        .from(users)
        .where(where)
        .limit(perPage)
        .offset(offset),
      db.select({ count: sql`COUNT(*)` }).from(users).where(where),
    ])

    let profilesMap = {}
    if (data.length > 0) {
      const ids = data.map(u => u.id)
      const profiles = await db
        .select({ user_id: coach_profiles.user_id, specialties: coach_profiles.specialties, cref: coach_profiles.cref, bio: coach_profiles.bio })
        .from(coach_profiles)
        .where(sql`${coach_profiles.user_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      profiles.forEach(p => { profilesMap[p.user_id] = p })
    }

    const enriched = data.map(u => ({
      ...u,
      specialty: profilesMap[u.id]?.specialties ?? null,
      cref:      profilesMap[u.id]?.cref        ?? null,
    }))

    const total = Number(count)
    return NextResponse.json({ data: enriched, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (err) {
    console.error('[GET /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/coaches
// Role autom\u00e1tico: super_admin cadastra → coach (independente)
//                  tenant_admin cadastra → academy_coach (funcion\u00e1rio)
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permiss\u00e3o' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, email, password, specialty, phone } = body

    if (!name || !email || !password)
      return NextResponse.json({ error: 'Nome, email e senha s\u00e3o obrigat\u00f3rios' }, { status: 400 })

    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1)

    if (existing) {
      const roleLabel = {
        athlete: 'um atleta', academy_athlete: 'um aluno',
        coach: 'um coach independente', academy_coach: 'um professor',
        tenant_admin: 'um administrador', receptionist: 'um recepcionista',
      }
      return NextResponse.json(
        { error: `Email j\u00e1 cadastrado como ${roleLabel[existing.role] ?? 'outro usu\u00e1rio'}` },
        { status: 409 }
      )
    }

    // Role autom\u00e1tico pelo contexto de quem cadastra
    const coachRole = session.user.role === 'super_admin' ? 'coach' : 'academy_coach'

    const userId = randomUUID()
    const hash   = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      id:            userId,
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      password_hash: hash,
      role:          coachRole,
      phone:         phone ?? null,
      is_active:     1,
      tenant_id:     session.user.role === 'super_admin'
                       ? (body.tenant_id ?? null)
                       : session.user.tenant_id,
      created_at:    new Date(),
      updated_at:    new Date(),
    })

    await db.insert(coach_profiles).values({
      id:          randomUUID(),
      user_id:     userId,
      specialties: specialty ?? null,
      created_at:  new Date(),
      updated_at:  new Date(),
    })

    return NextResponse.json({ success: true, id: userId, role: coachRole }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
