import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users } from '@/lib/db/schema/index.js'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET /api/coaches/[id]
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const [coach] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, Number(id)),
          eq(users.tenant_id, session.user.tenant_id)
        )
      )
      .limit(1)

    if (!coach) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const { password_hash, ...safe } = coach
    return NextResponse.json(safe)
  } catch (err) {
    console.error('[GET /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT /api/coaches/[id]
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { name, email, password, specialty, phone, is_active, role } = body

    const updates = {
      updated_at: new Date(),
      ...(name       && { name }),
      ...(email      && { email }),
      ...(specialty  !== undefined && { specialty }),
      ...(phone      !== undefined && { phone }),
      ...(is_active  !== undefined && { is_active }),
      ...(role       && ['coach', 'academy_coach'].includes(role) && { role }),
    }

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10)
    }

    await db.update(users).set(updates).where(eq(users.id, Number(id)))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/coaches/[id]
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['super_admin', 'tenant_admin']
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.delete(users).where(eq(users.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/coaches/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
