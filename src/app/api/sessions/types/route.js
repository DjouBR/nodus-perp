import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_types } from '@/lib/db/schema/sessions'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const types = await db
      .select()
      .from(session_types)
      .where(eq(session_types.tenant_id, session.user.tenant_id))

    return NextResponse.json(types)
  } catch (err) {
    console.error('[GET /api/sessions/types]', err)
    return NextResponse.json({ error: 'Erro ao buscar tipos' }, { status: 500 })
  }
}
