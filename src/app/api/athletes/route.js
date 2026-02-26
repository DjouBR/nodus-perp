import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles, sensors } from '@/lib/db/schema/index.js'
import { eq, and, or, like, sql } from 'drizzle-orm'

// ───────────────────────────────────────────────────────────────────
// GET /api/athletes
// Query params:
//   ?page=1&perPage=20       paginacao
//   ?search=ana              busca por nome ou email
//   ?status=active           filtro por status (active | inactive | suspended)
// ───────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas roles com acesso a atletas
    const allowedRoles = ['super_admin', 'tenant_admin', 'coach', 'receptionist']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1'))
    const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '20'))
    const search  = searchParams.get('search')  ?? ''
    const status  = searchParams.get('status')  ?? ''
    const offset  = (page - 1) * perPage

    // Monta condições WHERE
    const conditions = [
      eq(users.role, 'athlete'),
    ]

    // Isola por tenant (super_admin vê todos)
    if (session.user.role !== 'super_admin' && session.user.tenant_id) {
      conditions.push(eq(users.tenant_id, session.user.tenant_id))
    }

    // Filtro de busca por nome ou email
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }

    // Filtro de status (via athlete_profiles)
    // Buscamos primeiro os IDs de atletas com o status desejado
    let filteredAthleteIds = null
    if (status) {
      const profileRows = await db
        .select({ user_id: athlete_profiles.user_id })
        .from(athlete_profiles)
        .where(eq(athlete_profiles.status, status))
      filteredAthleteIds = profileRows.map(r => r.user_id)
      if (filteredAthleteIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, perPage, totalPages: 0 })
      }
    }

    // Query principal: usuários atletas
    const whereClause = and(...conditions)

    const [totalRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(users)
      .where(whereClause)

    const total      = Number(totalRow?.count ?? 0)
    const totalPages = Math.ceil(total / perPage)

    const athleteRows = await db
      .select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        phone:      users.phone,
        gender:     users.gender,
        birthdate:  users.birthdate,
        avatar_url: users.avatar_url,
        is_active:  users.is_active,
        tenant_id:  users.tenant_id,
        unit_id:    users.unit_id,
        created_at: users.created_at,
      })
      .from(users)
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(users.name)

    if (athleteRows.length === 0) {
      return NextResponse.json({ data: [], total, page, perPage, totalPages })
    }

    // Busca perfis dos atletas retornados
    const ids = athleteRows.map(a => a.id)

    const profiles = await db
      .select()
      .from(athlete_profiles)
      .where(sql`${athlete_profiles.user_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)

    const sensorList = await db
      .select()
      .from(sensors)
      .where(sql`${sensors.athlete_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)

    // Mapeia para lookup rápido
    const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]))
    const sensorMap  = Object.fromEntries(sensorList.map(s => [s.athlete_id, s]))

    // Monta resposta final
    const data = athleteRows.map(a => ({
      ...a,
      profile: profileMap[a.id] ?? null,
      sensor:  sensorMap[a.id]  ?? null,
    }))

    // Filtra por status se necessário
    const filtered = filteredAthleteIds
      ? data.filter(a => filteredAthleteIds.includes(a.id))
      : data

    return NextResponse.json({
      data:       filtered,
      total,
      page,
      perPage,
      totalPages,
    })

  } catch (error) {
    console.error('[GET /api/athletes]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
