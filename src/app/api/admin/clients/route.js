import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, tenants, athlete_profiles, coach_profiles, plans } from '@/lib/db/schema'
import { eq, or, like, and, desc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

// Roles que se enquadram como "clientes" do super_admin
const CLIENT_ROLES = ['tenant_admin', 'coach', 'athlete']

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit    = Math.min(100, parseInt(searchParams.get('limit') || '20'))
  const offset   = (page - 1) * limit
  const search   = searchParams.get('search')   || ''
  const role     = searchParams.get('role')     || ''
  const status   = searchParams.get('status')   || ''

  try {
    // Condições base
    const conditions = [
      or(...CLIENT_ROLES.map(r => eq(users.role, r)))
    ]

    if (role && CLIENT_ROLES.includes(role)) {
      conditions.push(eq(users.role, role))
    }
    if (status === 'active')   conditions.push(eq(users.is_active, 1))
    if (status === 'inactive') conditions.push(eq(users.is_active, 0))
    if (search) {
      conditions.push(
        or(
          like(users.name,  `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.phone, `%${search}%`),
        )
      )
    }

    const where = and(...conditions)

    // Total
    const [{ total }] = await db
      .select({ total: sql`COUNT(*)`.mapWith(Number) })
      .from(users)
      .where(where)

    // Dados paginados com LEFT JOIN no tenant
    const rows = await db
      .select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        phone:      users.phone,
        role:       users.role,
        is_active:  users.is_active,
        avatar_url: users.avatar_url,
        document:   users.document,
        created_at: users.created_at,
        last_login: users.last_login,
        tenant_id:  users.tenant_id,
        tenant_name: tenants.name,
        tenant_type: tenants.type,
        tenant_status: tenants.status,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenant_id, tenants.id))
      .where(where)
      .orderBy(desc(users.created_at))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data:       rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[GET /api/admin/clients]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, document, birthdate, gender, role, password, tenant_name, tenant_type, cref, specialties, bio } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email e role são obrigatórios' }, { status: 400 })
    }
    if (!CLIENT_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Role inválido para cliente' }, { status: 400 })
    }

    // Verificar email único
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
    if (existing) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })

    const userId       = uuidv4()
    const password_hash = await bcrypt.hash(password || 'nodus@123', 10)

    // Se for tenant_admin, criar tenant também
    let tenant_id = null
    if (role === 'tenant_admin' && tenant_name) {
      tenant_id = uuidv4()
      await db.insert(tenants).values({
        id:     tenant_id,
        name:   tenant_name,
        type:   tenant_type || 'academy',
        status: 'active',
      })
    }

    await db.insert(users).values({
      id: userId,
      name, email, phone: phone || null,
      document: document || null,
      birthdate: birthdate || null,
      gender: gender || null,
      role,
      tenant_id,
      is_active: 1,
      password_hash,
    })

    // Perfil de coach
    if (role === 'coach') {
      await db.insert(coach_profiles).values({
        id:          uuidv4(),
        user_id:     userId,
        cref:        cref || null,
        specialties: specialties || null,
        bio:         bio || null,
      })
    }

    return NextResponse.json({ id: userId, tenant_id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/clients]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
