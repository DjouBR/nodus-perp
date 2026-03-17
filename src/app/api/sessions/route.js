import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_types } from '@/lib/db/schema/sessions'
import { users } from '@/lib/db/schema/users'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET /api/sessions — lista sessões da academia
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tenantId = session.user.tenant_id

  try {
    const sessions = await db
      .select({
        id:              training_sessions.id,
        name:            training_sessions.name,
        start_datetime:  training_sessions.start_datetime,
        end_datetime:    training_sessions.end_datetime,
        duration_min:    training_sessions.duration_min,
        status:          training_sessions.status,
        capacity:        training_sessions.capacity,
        notes:           training_sessions.notes,
        target_zone_min: training_sessions.target_zone_min,
        target_zone_max: training_sessions.target_zone_max,
        coach_id:        training_sessions.coach_id,
        session_type_id: training_sessions.session_type_id,
        coach_name:      users.name,
        type_name:       session_types.name,
        type_color:      session_types.color,
        type_icon:       session_types.icon,
      })
      .from(training_sessions)
      .leftJoin(users, eq(training_sessions.coach_id, users.id))
      .leftJoin(session_types, eq(training_sessions.session_type_id, session_types.id))
      .where(eq(training_sessions.tenant_id, tenantId))

    return NextResponse.json(sessions)
  } catch (err) {
    console.error('[GET /api/sessions]', err)
    return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })
  }
}

// POST /api/sessions — cria nova sessão
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tenantId = session.user.tenant_id
  const role = session.user.role

  if (!['tenant_admin', 'academy_coach'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { name, session_type_id, coach_id, start_datetime, duration_min, capacity, target_zone_min, target_zone_max, notes } = body

  if (!name || !start_datetime) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const start = new Date(start_datetime)
  const end   = new Date(start.getTime() + (duration_min || 60) * 60 * 1000)
  const finalCoachId = role === 'academy_coach' ? session.user.id : (coach_id || session.user.id)

  try {
    const id = randomUUID()
    await db.insert(training_sessions).values({
      id,
      tenant_id:       tenantId,
      session_type_id: session_type_id || null,
      coach_id:        finalCoachId,
      name,
      start_datetime:  start,
      end_datetime:    end,
      duration_min:    duration_min || 60,
      capacity:        capacity || 30,
      target_zone_min: target_zone_min || 2,
      target_zone_max: target_zone_max || 4,
      notes:           notes || null,
      status:          'scheduled',
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions]', err)
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })
  }
}
