/**
 * POST /api/sessions/[id]/token
 *
 * Gera (ou retorna o existente) token público de monitor para a sessão.
 * Chamado ao abrir o Lobby (Tela 1) para obter o link de compartilhamento.
 *
 * Retorna:
 *   { token, monitorUrl }
 *
 * O monitorUrl é a URL completa para abrir no TV/SmartTV:
 *   https://[host]/monitor/[token]
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'          // ← correto: não importar do route.js
import { db } from '@/lib/db'
import { session_monitor_tokens, training_sessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req, { params }) {
  const authSession = await getServerSession(authOptions)
  if (!authSession) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id: sessionId } = await params

  try {
    // 1. Verifica se a sessão existe e pertence ao tenant do usuário
    const [trainingSession] = await db
      .select()
      .from(training_sessions)
      .where(eq(training_sessions.id, sessionId))
      .limit(1)

    if (!trainingSession) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // 2. Verifica se já existe token ativo para esta sessão
    const [existing] = await db
      .select()
      .from(session_monitor_tokens)
      .where(
        and(
          eq(session_monitor_tokens.session_id, sessionId),
          eq(session_monitor_tokens.revoked, 0),
        )
      )
      .limit(1)

    if (existing) {
      const host = req.headers.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return NextResponse.json({
        ok:         true,
        token:      existing.token,
        monitorUrl: `${protocol}://${host}/monitor/${existing.token}`,
      })
    }

    // 3. Cria novo token — expira no scheduled_end + 2 horas (ou agora + 8h como fallback)
    const baseExpiry = trainingSession.scheduled_end
      ? new Date(trainingSession.scheduled_end)
      : new Date()
    baseExpiry.setHours(baseExpiry.getHours() + 2)

    const newToken = randomUUID()

    await db.insert(session_monitor_tokens).values({
      token:      newToken,
      session_id: sessionId,
      tenant_id:  trainingSession.tenant_id ?? null,
      expires_at: baseExpiry,
      revoked:    0,
    })

    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

    return NextResponse.json({
      ok:         true,
      token:      newToken,
      monitorUrl: `${protocol}://${host}/monitor/${newToken}`,
    })
  } catch (err) {
    console.error('[POST /api/sessions/id/token] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
