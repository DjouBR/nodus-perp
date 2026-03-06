import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, coach_profiles } from '@/lib/db/schema/index.js'
import { eq, or, like, and, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coaches — lista coaches com paginação e busca
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '20'))
  const search  = searchParams.get('search') ?? ''
  const offset  = (page - 1) * perPage

  try {
    const baseWhere = and(
      or(eq(users.role, 'coach'), eq(users.role, 'academy_coach')),
      session.user.role !== 'super_admin'
        ? eq(users.tenant_id, session.user.tenant_id)
        : undefined
    )

    const searchWhere = search
      ? and(baseWhere, or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)))
      : baseWhere

    const [list, [{ total }]] = await Promise.all([
      db.select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        phone:      users.phone,
        role:       users.role,
        is_active:  users.is_active,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        tenant_id:  users.tenant_id,
      })
        .from(users)
        .where(searchWhere)
        .orderBy(desc(users.created_at))
        .limit(perPage)
        .offset(offset),

      db.select({ total: db.$count(users, searchWhere) }).from(users),
    ])

    return NextResponse.json({
      data:       list,
      total:      Number(total),
      page,
      perPage,
      totalPages: Math.ceil(Number(total) / perPage),
    })
  } catch (err) {
    console.error('[GET /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coaches — cadastrar novo coach
// Senha provisória automática: nodus@123
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, email, phone, specialty, tenant_id } = body

    if (!name || !email)
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })

    // Verificar email duplicado
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing)
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })

    // Role baseado em quem está criando
    const role = session.user.role === 'super_admin' ? 'coach' : 'academy_coach'
    const effectiveTenantId = session.user.role === 'super_admin' ? null : (tenant_id ?? session.user.tenant_id)

    // Senha provisória fixa
    const password_hash = await bcrypt.hash('nodus@123', 10)

    const userId = randomUUID()
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password_hash,
      role,
      tenant_id: effectiveTenantId,
      phone: phone ?? null,
      is_active: 1,
    })

    // Criar coach_profile vazio com especialidade se informada
    await db.insert(coach_profiles).values({
      id:          randomUUID(),
      user_id:     userId,
      specialties: specialty ? JSON.stringify([specialty]) : null,
    })

    return NextResponse.json({ success: true, id: userId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
