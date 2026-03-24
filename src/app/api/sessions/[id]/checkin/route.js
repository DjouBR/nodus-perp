import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_athletes, training_sessions } from '@/lib/db/schema/sessions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

// PUT /api/sessions/[id]/checkin
// Alterna o check-in do atleta logado na sessão.
// Para academy_athlete / coach_athlete: inscreve automaticamente se ainda não estiver.
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId } = session.user

  if (!ATHLETE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id: sessionId } = await params

  try {
    // Busca a sessão para validações básicas
    const [trainingSession] = await db
      .select({
        status:         training_sessions.status,
        start_datetime: training_sessions.start_datetime,
        end_datetime:   training_sessions.end_datetime,
      })
      .from(training_sessions)
      .where(eq(training_sessions.id, sessionId))

    if (!trainingSession) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    if (trainingSession.status === 'cancelled') {
      return NextResponse.json({ error: 'Não é possível fazer check-in em sessão cancelada' }, { status: 400 })
    }

    if (trainingSession.status === 'finished') {
      return NextResponse.json({ error: 'Não é possível fazer check-in em sessão finalizada' }, { status: 400 })
    }

    // Busca enrollment existente
    const [enrollment] = await db
      .select({ checked_in: session_athletes.checked_in })
      .from(session_athletes)
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, userId)
        )
      )

    if (!enrollment) {
      // Auto-inscrição: academy_athlete / coach_athlete vêem todas as sessões sem inscrição prévia
      if (role === 'academy_athlete' || role === 'coach_athlete') {
        await db.insert(session_athletes).values({
          id:         randomUUID(),
          session_id: sessionId,
          athlete_id: userId,
          checked_in: 1,
        })
        return NextResponse.json({ checked_in: 1 })
      }

      // athlete independente precisa de inscrição prévia
      return NextResponse.json({ error: 'Você não está inscrito nesta sessão' }, { status: 404 })
    }

    // Toggle: 0 → 1 ou 1 → 0
    const newValue = enrollment.checked_in ? 0 : 1

    await db
      .update(session_athletes)
      .set({ checked_in: newValue })
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, userId)
        )
      )

    return NextResponse.json({ checked_in: newValue })
  } catch (err) {
    console.error('[PUT /api/sessions/[id]/checkin]', err)
    return NextResponse.json({ error: 'Erro ao realizar check-in' }, { status: 500 })
  }
}
