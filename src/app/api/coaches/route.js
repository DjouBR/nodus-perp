import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users } from '@/lib/db/schema/index.js'
import { eq, and, or, like, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const COACH_ROLES = ['coach', 'academy_coach']

// GET /api/coaches
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '10'))
  const search  = searchParams.get('search') ?? ''
  const type    = searchParams.get('type')   ?? ''
  const offset  = (page - 1) * perPage

  try {
    const role      = session.user.role
    const tenantId  = session.user.tenant_id

    // Monta filtros
    const filters = []

    // Isolamento por tenant (super_admin vê todos)
    if (role !== 'super_admin') {
      filters.push(eq(users.tenant_id, tenantId))
    }

    // Apenas roles coach/academy_coach
    if (type && COACH_ROLES.includes(type)) {
      filters.push(eq(users.role, type))
    } else {
      filters.push(
        or(
          eq(users.role, 'coach'),
          eq(users.role, 'academy_coach')
        )
      )
    }

    // Busca por nome ou email
    if (search) {
      filters.push(
        or(
          like(users.name,  `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }

    const where = filters.length ? and(...filters) : undefined

    const [data, [{ count }]] = await Promise.all([
      db.select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        role:       users.role,
        type:       users.role,
        specialty:  users.specialty,
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
      db.select({ count: sql`COUNT(*)` })
        .from(users)
        .where(where),
    ])

    const total = Number(count)

    return NextResponse.json({
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (err) {
    console.error('[GET /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST /api/coaches
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, email, password, type, specialty, phone, is_active } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    // Verifica email duplicado
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const role = (type === 'coach') ? 'coach' : 'academy_coach'
    const hash = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      name,
      email,
      password_hash: hash,
      role,
      specialty:  specialty  ?? null,
      phone:      phone      ?? null,
      is_active:  is_active  ?? true,
      tenant_id:  session.user.role === 'super_admin' ? (body.tenant_id ?? null) : session.user.tenant_id,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
