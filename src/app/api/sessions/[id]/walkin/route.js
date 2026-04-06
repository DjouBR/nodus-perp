/**
 * POST /api/sessions/[id]/walkin
 *
 * Adiciona um atleta já cadastrado no tenant à sessão como walk-in,
 * sem necessidade de inscrição prévia.
 *
 * Body: { athleteId: string }
 *
 * Retorna:
 *   201 { ok: true, athlete: { athlete_id, name, avatar_url, hr_max, checked_in, sensor_id } }
 *   400 athleteId ausente
 *   403 acesso negado (role insuficiente ou tenant diferente)
 *   404 sessão ou atleta não encontrado
 *   409 atleta já inscrito nesta sessão
 *   500 erro interno
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const STAFF_ROLES = ['tenant_admin', 'academy_coach', 'coach', 'receptionist']

export async function POST(req, { params }) {
  const authSession = await getServerSession(authOptions)
  if (!authSession) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { role, id: userId, tenant_id: tenantId } = authSession.user

  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id: sessionId } = await params
  const body = await req.json()
  const { athleteId } = body

  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId é obrigatório' }, { status: 400 })
  }

  try {
    // 1. Verifica que a sessão existe e pertence ao tenant
    const [session] = await db
      .select({ id: training_sessions.id, tenant_id: training_sessions.tenant_id, coach_id: training_sessions.coach_id })
      .from(training_sessions)
      .where(eq(training_sessions.id, sessionId))
      .limit(1)

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // Coach independente só pode manipular suas próprias sessões
    if (role === 'coach' && session.coach_id !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Tenant_admin / academy_coach / receptionist: valida pelo tenant
    if (tenantId && session.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // 2. Verifica que o atleta existe (e pertence ao mesmo tenant, quando aplicável)
    const [athlete] = await db
      .select({
        id:         users.id,
        name:       users.name,
        avatar_url: users.avatar_url,
        tenant_id:  users.tenant_id,
        hr_max:     athlete_profiles.hr_max,
      })
      .from(users)
      .leftJoin(athlete_profiles, eq(athlete_profiles.user_id, users.id))
      .where(eq(users.id, athleteId))
      .limit(1)

    if (!athlete) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }

    if (tenantId && athlete.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Atleta não pertence a este tenant' }, { status: 403 })
    }

    // 3. Verifica se já está inscrito
    const [existing] = await db
      .select({ id: session_athletes.id })
      .from(session_athletes)
      .where(and(
        eq(session_athletes.session_id, sessionId),
        eq(session_athletes.athlete_id, athleteId),
      ))
      .limit(1)

    if (existing) {
      return NextResponse.json({ error: 'Atleta já está inscrito nesta sessão' }, { status: 409 })
    }

    // 4. Insere como walk-in com check-in já confirmado
    await db.insert(session_athletes).values({
      id:         randomUUID(),
      session_id: sessionId,
      athlete_id: athleteId,
      checked_in: 1,
      checkin_at: new Date(),
    })

    return NextResponse.json({
      ok: true,
      athlete: {
        athlete_id: athlete.id,
        name:       athlete.name,
        avatar_url: athlete.avatar_url ?? null,
        hr_max:     athlete.hr_max ?? null,
        checked_in: 1,
        sensor_id:  null,
        walk_in:    true,
      },
    }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/sessions/id/walkin]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
