/**
 * POST /api/monitor/[token]/revoke
 *
 * Rota autenticada (chamada internamente pelo /finish).
 * Revoga o token de monitor ao encerrar a sessão.
 * Após revogado, o monitor.html exibe "Sessão encerrada" e para de atualizar.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { session_monitor_tokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { token } = await params

  try {
    await db
      .update(session_monitor_tokens)
      .set({ revoked: 1 })
      .where(eq(session_monitor_tokens.token, token))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/monitor/token/revoke] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
