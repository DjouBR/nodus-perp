import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, tenants, coach_profiles, athlete_profiles } from '@/lib/db/schema'
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

    await db.update(users).set({
      ...(name       != null && { name }),
      ...(email      != null && { email }),
      ...(phone      != null && { phone }),
      ...(document   != null && { document }),
      ...(birthdate  != null && { birthdate }),
      ...(gender     != null && { gender }),
      ...(is_active  != null && { is_active }),
      ...(role       != null && { role }),
    }).where(eq(users.id, id))

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
