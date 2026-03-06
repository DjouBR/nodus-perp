import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, tenants, coach_profiles, athlete_profiles } from '@/lib/db/schema/index.js'
import { eq } from 'drizzle-orm'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  try {
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(tenants, eq(users.tenant_id, tenants.id))
      .where(eq(users.id, id))

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let profile = null
    if (['coach', 'academy_coach'].includes(user.users.role)) {
      const [cp] = await db.select().from(coach_profiles).where(eq(coach_profiles.user_id, id))
      profile = cp ?? null
    } else if (['athlete', 'academy_athlete', 'coach_athlete'].includes(user.users.role)) {
      const [ap] = await db.select().from(athlete_profiles).where(eq(athlete_profiles.user_id, id))
      profile = ap ?? null
    }

    return NextResponse.json({ ...user.users, tenant: user.tenants, profile })
  } catch (err) {
    console.error('[GET /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  try {
    const body = await request.json()
    const { name, email, phone, document, birthdate, gender, is_active, role } = body

    // Monta apenas campos presentes (sem updated_at — MySQL gerencia via onUpdateNow)
    const updateData = {}
    if (name      != null) updateData.name      = name
    if (email     != null) updateData.email     = email
    if (phone     != null) updateData.phone     = phone
    if (document  != null) updateData.document  = document
    if (birthdate != null) updateData.birthdate = birthdate || null
    if (gender    != null) updateData.gender    = gender || null
    if (is_active != null) updateData.is_active = is_active ? 1 : 0
    if (role      != null) updateData.role      = role

    if (Object.keys(updateData).length > 0)
      await db.update(users).set(updateData).where(eq(users.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  try {
    await db.update(users).set({ is_active: 0 }).where(eq(users.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
