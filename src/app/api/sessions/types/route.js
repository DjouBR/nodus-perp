import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_types } from '@/lib/db/schema/sessions'
import { eq, and, or, isNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const ALLOWED_ROLES = ['tenant_admin', 'academy_coach', 'coach']

// Filtro de tipos por role:
// - academia: tenant_id = user.tenant_id
// - coach independente: tenant_id IS NULL AND criado pelo próprio coach (via created_by)
//   Como não temos created_by no schema ainda, usamos tenant_id = NULL como proxy,
//   mas isolamos por coach usando um campo owner_id que adicionamos aqui.
// Simplificação atual: coach vê tipos com tenant_id = seu próprio id (usamos tenant_id como owner)
function typesFilter(user) {
  if (user.role === 'coach') {
    // Armazenamos o user.id no campo tenant_id para coaches independentes
    return eq(session_types.tenant_id, user.id)
  }
  return eq(session_types.tenant_id, user.tenant_id)
}

// GET /api/sessions/types
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const types = await db
      .select()
      .from(session_types)
      .where(typesFilter(session.user))

    return NextResponse.json(types)
  } catch (err) {
    console.error('[GET /api/sessions/types]', err)
    return NextResponse.json({ error: 'Erro ao buscar tipos' }, { status: 500 })
  }
}

// POST /api/sessions/types — cria novo tipo de sessão
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId, tenant_id: tenantId } = session.user

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { name, color, icon } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  // Coach independente usa o próprio user.id como tenant_id para isolar os seus tipos
  const ownerTenantId = role === 'coach' ? userId : tenantId

  try {
    const id = randomUUID()
    await db.insert(session_types).values({
      id,
      tenant_id: ownerTenantId,
      name:      name.trim(),
      color:     color || '#6366f1',
      icon:      icon  || null,
    })
    return NextResponse.json({ id, name: name.trim(), color: color || '#6366f1', icon: icon || null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions/types]', err)
    return NextResponse.json({ error: 'Erro ao criar tipo' }, { status: 500 })
  }
}
