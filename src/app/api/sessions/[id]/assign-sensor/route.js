/**
 * PUT /api/sessions/[id]/assign-sensor
 *
 * Atribui (ou remove) um sensor ANT+ a um atleta já inscrito na sessão.
 * Chamado pelo Lobby ao selecionar o sensor no dropdown.
 *
 * Body: { athleteId, sensorId }  (sensorId = null para remover)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_athletes } from '@/lib/db/schema/sessions'
import { eq, and } from 'drizzle-orm'

const STAFF_ROLES = ['super_admin', 'tenant_admin', 'coach', 'academy_coach', 'receptionist']

export async function PUT(req, { params }) {
  const auth = await getServerSession(authOptions)
  if (!auth?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!STAFF_ROLES.includes(auth.user.role))
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id: sessionId } = await params
  const { athleteId, sensorId } = await req.json()

  if (!athleteId) return NextResponse.json({ error: 'athleteId é obrigatório' }, { status: 400 })

  try {
    const result = await db
      .update(session_athletes)
      .set({ sensor_id: sensorId ?? null })
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, athleteId)
        )
      )

    return NextResponse.json({ ok: true, sensor_id: sensorId ?? null })
  } catch (err) {
    console.error('[PUT /api/sessions/[id]/assign-sensor]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
