/**
 * src/app/sessions/[id]/monitor/route.js
 *
 * Tela 3 — Monitor do Treinador (rota autenticada).
 * Aberta pelo botão "Monitor Treinador" do Lobby: /sessions/[id]/monitor
 *
 * Serve public/monitor/coach.html em tela cheia (sem o layout Vuexy) e injeta:
 *   window.__SESSION_ID__ — id da sessão
 *   window.__ANT_PORT__   — porta do ant-server (WebSocket)
 *
 * Os dados da sessão e dos atletas vêm de GET /api/sessions/[id], que já aplica
 * o isolamento por tenant/coach. Aqui só validamos login e role.
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

const COACH_ROLES = ['tenant_admin', 'coach', 'academy_coach']

export async function GET(req, { params }) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    const login = new URL('/login', req.url)
    login.searchParams.set('callbackUrl', `/sessions/${id}/monitor`)
    return NextResponse.redirect(login)
  }
  if (!COACH_ROLES.includes(session.user.role)) {
    return NextResponse.redirect(new URL('/home', req.url))
  }
  if (!/^[\w-]+$/.test(String(id))) {
    return new NextResponse('Sessão inválida', { status: 400 })
  }

  let html
  try {
    html = await readFile(join(process.cwd(), 'public', 'monitor', 'coach.html'), 'utf-8')
  } catch {
    return new NextResponse('Monitor do treinador não encontrado', { status: 404 })
  }

  const antPort = process.env.ANT_SERVER_PORT || '3001'
  const injection =
    `<script>window.__SESSION_ID__ = ${JSON.stringify(String(id))};` +
    `window.__ANT_PORT__ = ${JSON.stringify(String(antPort))};</script>\n`
  html = html.replace('</head>', injection + '</head>')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
