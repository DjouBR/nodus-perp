import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/libs/db'
import { trainingSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'

const STAFF_ROLES = ['tenant_admin', 'coach', 'academy_coach']

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!STAFF_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Busca a sessão
  const [trainingSession] = await db
    .select({
      id:             trainingSessions.id,
      status:         trainingSessions.status,
      tenant_id:      trainingSessions.tenantId,
      start_datetime: trainingSessions.startDatetime,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1)

  if (!trainingSession)
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

  // Isolamento por tenant
  if (
    session.user.role !== 'super_admin' &&
    trainingSession.tenant_id !== session.user.tenant_id
  ) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (trainingSession.status === 'cancelled')
    return NextResponse.json({ error: 'Sessão cancelada não pode ser iniciada' }, { status: 400 })

  if (trainingSession.status === 'finished')
    return NextResponse.json({ error: 'Sessão já foi encerrada' }, { status: 400 })

  if (trainingSession.status === 'active')
    return NextResponse.json({ error: 'Sessão já está ativa' }, { status: 400 })

  // Atualiza para active
  await db
    .update(trainingSessions)
    .set({
      status:         'active',
      startDatetime:  trainingSession.start_datetime ?? new Date(),
    })
    .where(eq(trainingSessions.id, id))

  return NextResponse.json({ success: true, message: 'Sessão iniciada com sucesso' })
}
