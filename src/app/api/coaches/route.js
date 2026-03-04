import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, coach_profiles } from '@/lib/db/schema/index.js'
import { eq, and, or, like, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// Roles válidos para coach no ENUM do banco: apenas 'coach'
// Não existe 'academy_coach' no ENUM — diferenciamos via coach_profiles ou campo futuro
const COACH_ROLES = ['coach']

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
  const offset  = (page - 1) * perPage

  try {
    // Filtro base: role = 'coach' (\u00fanico valor v\u00e1lido no ENUM para professores)
    const conditions = [eq(users.role, 'coach')]

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

    // Enriquece com dados do coach_profiles (specialties, cref, bio, employee_type)
    let profilesMap = {}
    if (data.length > 0) {
      const ids = data.map(u => u.id)
      const profiles = await db
        .select({
          user_id:     coach_profiles.user_id,
          specialties: coach_profiles.specialties,
          cref:        coach_profiles.cref,
          bio:         coach_profiles.bio,
        })
        .from(coach_profiles)
        .where(sql`${coach_profiles.user_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      profiles.forEach(p => { profilesMap[p.user_id] = p })
    }

    const enriched = data.map(u => ({
      ...u,
      specialty: profilesMap[u.id]?.specialties ?? null,
      cref:      profilesMap[u.id]?.cref        ?? null,
      bio:       profilesMap[u.id]?.bio         ?? null,
      // employee_type vem do coach_profiles — usamos campo extra para diferenciar
      // funcion\u00e1rio x independente sem precisar de segundo ENUM no banco
      employee_type: profilesMap[u.id]?.employee_type ?? 'academy',
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
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permiss\u00e3o' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, email, password, type, specialty, phone } = body

    if (!name || !email || !password)
      return NextResponse.json({ error: 'Nome, email e senha s\u00e3o obrigat\u00f3rios' }, { status: 400 })

    // Verifica email duplicado — informa qual role j\u00e1 usa esse email
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1)

    if (existing) {
      const roleLabel = {
        athlete:      'um atleta',
        coach:        'um coach',
        tenant_admin: 'um administrador',
        receptionist: 'um recepcionista',
        super_admin:  'um super admin',
      }
      const who = roleLabel[existing.role] ?? 'outro usu\u00e1rio'
      return NextResponse.json(
        { error: `Este email j\u00e1 est\u00e1 cadastrado como ${who}` },
        { status: 409 }
      )
    }

    const userId = randomUUID()
    const hash   = await bcrypt.hash(password, 10)

    // role fixo = 'coach' (\u00fanico valor v\u00e1lido no ENUM para professores)
    // O tipo funcion\u00e1rio/independente fica em coach_profiles
    await db.insert(users).values({
      id:            userId,
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      password_hash: hash,
      role:          'coach',          // SEMPRE 'coach' — academy_coach n\u00e3o existe no ENUM
      phone:         phone ?? null,
      is_active:     1,
      tenant_id:     session.user.role === 'super_admin'
                       ? (body.tenant_id ?? null)
                       : session.user.tenant_id,
      created_at:    new Date(),
      updated_at:    new Date(),
    })

    // Cria coach_profiles com especialidade e tipo (independente x funcion\u00e1rio)
    await db.insert(coach_profiles).values({
      id:          randomUUID(),
      user_id:     userId,
      specialties: specialty ?? null,
      // type: 'academy' | 'independent' — guardamos aqui at\u00e9 migrar o schema
      bio:         type === 'coach' ? 'independent' : 'academy',
      created_at:  new Date(),
      updated_at:  new Date(),
    })

    return NextResponse.json({ success: true, id: userId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/coaches]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
