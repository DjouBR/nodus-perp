/**
 * PUT /api/sessions/[id]/checkin-staff
 *
 * Check-in MANUAL feito pelo staff (coach, receptionist, tenant_admin) em nome de um atleta.
 * Usado na Tela 1 (Lobby) para confirmar presença e opcionalmente já atribuir sensor ANT+.
 *
 * Body: { athleteId, sensorId? }
 *
 * - Se o atleta ainda não tem registro em session_athletes, cria automaticamente.
 * - Se já tem, alterna checked_in (toggle) e atualiza sensor_id se fornecido.
 * - Grava checkin_at ao marcar entrada (checked_in = 1).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_athletes, training_sessions } from '@/lib/db/schema/sessions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

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
    // Valida que a sessão existe e não está encerrada
    const [ts] = await db
      .select({ status: training_sessions.status })
      .from(training_sessions)
      .where(eq(training_sessions.id, sessionId))
      .limit(1)

    if (!ts) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    if (ts.status === 'finished')
      return NextResponse.json({ error: 'Sessão já encerrada' }, { status: 400 })
    if (ts.status === 'cancelled')
      return NextResponse.json({ error: 'Sessão cancelada' }, { status: 400 })

    // Busca registro existente
    const [enrollment] = await db
      .select()
      .from(session_athletes)
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, athleteId)
        )
      )
      .limit(1)

    if (!enrollment) {
      // Cria e já faz check-in
      await db.insert(session_athletes).values({
        id:         randomUUID(),
        session_id: sessionId,
        athlete_id: athleteId,
        sensor_id:  sensorId ?? null,
        checked_in: 1,
        checkin_at: new Date(),
      })
      return NextResponse.json({ checked_in: 1, sensor_id: sensorId ?? null })
    }

    // Toggle check-in
    const newCheckedIn = enrollment.checked_in ? 0 : 1
    await db
      .update(session_athletes)
      .set({
        checked_in: newCheckedIn,
        checkin_at: newCheckedIn ? new Date() : enrollment.checkin_at,
        ...(sensorId !== undefined ? { sensor_id: sensorId } : {}),
      })
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, athleteId)
        )
      )

    return NextResponse.json({ checked_in: newCheckedIn, sensor_id: sensorId ?? enrollment.sensor_id })
  } catch (err) {
    console.error('[PUT /api/sessions/[id]/checkin-staff]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
