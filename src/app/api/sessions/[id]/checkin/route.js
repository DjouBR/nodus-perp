import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_athletes, training_sessions } from '@/lib/db/schema/sessions'
import { eq, and } from 'drizzle-orm'

const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

// PUT /api/sessions/[id]/checkin
// Alterna o check-in do atleta logado na sessão.
// - Só possível se a sessão estiver 'active' ou agendada para hoje.
// - checked_in 0 → 1 (check-in) | 1 → 0 (desfazer check-in)
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId } = session.user

  if (!ATHLETE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id: sessionId } = await params

  try {
    // Verifica se a sessão existe e se o atleta está inscrito
    const [enrollment] = await db
      .select({
        checked_in:     session_athletes.checked_in,
        start_datetime: training_sessions.start_datetime,
        end_datetime:   training_sessions.end_datetime,
        status:         training_sessions.status,
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
      .where(
        and(
          eq(session_athletes.session_id, sessionId),
          eq(session_athletes.athlete_id, userId)
        )
      )

    if (!enrollment) {
      return NextResponse.json({ error: 'Você não está inscrito nesta sessão' }, { status: 404 })
    }

    if (enrollment.status === 'cancelled') {
      return NextResponse.json({ error: 'Não é possível fazer check-in em sessão cancelada' }, { status: 400 })
    }

    // Verifica se a sessão é hoje ou está ativa
    const now   = new Date()
    const start = new Date(enrollment.start_datetime)
    const isToday  = start.toDateString() === now.toDateString()
    const isActive = enrollment.status === 'active' ||
                     (now >= start && now < new Date(enrollment.end_datetime))

    if (!isToday && !isActive) {
      return NextResponse.json(
        { error: 'Check-in só disponível no dia da sessão' },
        { status: 400 }
      )
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
