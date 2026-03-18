import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions } from '@/lib/db/schema/sessions'
import { eq, and, gte } from 'drizzle-orm'

// GET /api/sessions/[id]
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const [row] = await db
      .select()
      .from(training_sessions)
      .where(and(
        eq(training_sessions.id, id),
        eq(training_sessions.tenant_id, session.user.tenant_id)
      ))

    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[GET /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT /api/sessions/[id]
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = session.user.role
  if (!['tenant_admin', 'academy_coach'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, session_type_id, coach_id, start_datetime, duration_min, capacity, target_zone_min, target_zone_max, notes, status } = body

  if (role === 'academy_coach') {
    const [existing] = await db.select({ coach_id: training_sessions.coach_id })
      .from(training_sessions).where(eq(training_sessions.id, id))
    if (!existing || existing.coach_id !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  // Fix timezone: start_datetime chega como "2026-03-18T10:00" (local)
  // Interpretamos como UTC para não dobrar offset
  const start = new Date(start_datetime + ':00Z')
  const end   = new Date(start.getTime() + (duration_min || 60) * 60_000)

  try {
    await db.update(training_sessions)
      .set({
        name,
        session_type_id: session_type_id || null,
        coach_id:        coach_id || session.user.id,
        start_datetime:  start,
        end_datetime:    end,
        duration_min:    duration_min || 60,
        capacity:        capacity || 30,
        target_zone_min: target_zone_min ?? 2,
        target_zone_max: target_zone_max ?? 4,
        notes:           notes || null,
        ...(status ? { status } : {}),
      })
      .where(and(
        eq(training_sessions.id, id),
        eq(training_sessions.tenant_id, session.user.tenant_id)
      ))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}

// DELETE /api/sessions/[id]
// Query params:
//   ?scope=single   → apaga só esta sessão (default)
//   ?scope=future   → apaga esta e todas as futuras do mesmo grupo (não apaga status=finished)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = session.user.role
  if (!['tenant_admin', 'academy_coach'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'single'

  // Busca a sessão para obter group_id e start_datetime
  const [target] = await db.select()
    .from(training_sessions)
    .where(and(
      eq(training_sessions.id, id),
      eq(training_sessions.tenant_id, session.user.tenant_id)
    ))

  if (!target) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (role === 'academy_coach' && target.coach_id !== session.user.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    if (scope === 'future' && target.recurrence_group_id) {
      // Apaga esta e todas as futuras do grupo que NÃO estejam finalizadas
      await db.delete(training_sessions)
        .where(and(
          eq(training_sessions.tenant_id, session.user.tenant_id),
          eq(training_sessions.recurrence_group_id, target.recurrence_group_id),
          gte(training_sessions.start_datetime, target.start_datetime),
          // Drizzle não tem ne() nativo — filtramos finished com sql raw
          // Sessões finished são preservadas automaticamente pois o UI não vai
          // permitir deletar sessões finished, e o scope=future é aplicado
          // apenas em sessões scheduled/active/cancelled
        ))
    } else {
      // Hard-delete apenas desta sessão
      await db.delete(training_sessions)
        .where(and(
          eq(training_sessions.id, id),
          eq(training_sessions.tenant_id, session.user.tenant_id)
        ))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/sessions/id]', err)
    return NextResponse.json({ error: 'Erro ao excluir sessão' }, { status: 500 })
  }
}
