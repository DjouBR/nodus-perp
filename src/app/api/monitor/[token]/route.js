/**
 * GET /api/monitor/[token]
 *
 * Rota pública — sem autenticação.
 * Valida o token de monitor e retorna os dados necessários para o monitor.html:
 *   - sessionId
 *   - tenantId
 *   - sessionName
 *   - sessionStatus
 *   - scheduledAt  ← novo: usado pelo overlay "Sessão em Breve"
 *   - antServerUrl (ws://)
 *
 * O monitor.html usa esses dados para:
 *   1. Montar a URL do WebSocket filtrando apenas atletas da sessão
 *   2. Exibir o nome da sessão no header
 *   3. Bloquear exibição se o token estiver revogado
 *   4. Exibir countdown se a sessão ainda não iniciou (status scheduled/pending)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { session_monitor_tokens, training_sessions } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function GET(req, { params }) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
  }

  try {
    // 1. Busca o token ativo (não revogado e dentro do prazo)
    let [row] = await db
      .select()
      .from(session_monitor_tokens)
      .where(
        and(
          eq(session_monitor_tokens.token, token),
          eq(session_monitor_tokens.revoked, 0),
          gt(session_monitor_tokens.expires_at, new Date()),
        )
      )
      .limit(1)

    // 1b. Se não encontrou pelo prazo, tenta sem filtro de expiry
    //     para detectar sessões scheduled/pending com token ainda válido
    if (!row) {
      const [rowNoExpiry] = await db
        .select()
        .from(session_monitor_tokens)
        .where(
          and(
            eq(session_monitor_tokens.token, token),
            eq(session_monitor_tokens.revoked, 0),
          )
        )
        .limit(1)

      if (rowNoExpiry) {
        // Só permite se a sessão for scheduled ou pending
        const [checkSession] = await db
          .select({ status: training_sessions.status })
          .from(training_sessions)
          .where(eq(training_sessions.id, rowNoExpiry.session_id))
          .limit(1)

        if (checkSession && (checkSession.status === 'scheduled' || checkSession.status === 'pending')) {
          row = rowNoExpiry
        }
      }
    }

    if (!row) {
      return NextResponse.json(
        { error: 'Token inválido, expirado ou sessão encerrada' },
        { status: 404 }
      )
    }

    // 2. Busca dados da sessão
    const [session] = await db
      .select({
        id:           training_sessions.id,
        name:         training_sessions.name,
        status:       training_sessions.status,
        scheduled_at: training_sessions.scheduled_start,
      })
      .from(training_sessions)
      .where(eq(training_sessions.id, row.session_id))
      .limit(1)

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // 3. Retorna dados para o monitor.html
    const antServerPort = process.env.ANT_SERVER_PORT || '3001'

    return NextResponse.json({
      ok:            true,
      sessionId:     session.id,
      sessionName:   session.name,
      sessionStatus: session.status,
      scheduledAt:   session.scheduled_at,
      tenantId:      row.tenant_id,
      antServerPort,
    })
  } catch (err) {
    console.error('[GET /api/monitor/token] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
