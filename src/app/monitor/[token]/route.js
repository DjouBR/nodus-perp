/**
 * src/app/monitor/[token]/route.js
 *
 * Route Handler público que serve o monitor.html para Smart TV / tablet.
 * Sem header/sidebar do Vuexy — tela cheia pura.
 *
 * Estratégia:
 *   - Lê o HTML estático de public/monitor/index.html
 *   - Injeta window.__MONITOR_TOKEN__ = '<token>' antes do </head>
 *   - Serve o HTML diretamente como Response
 *
 * IMPORTANTE: Este arquivo deve ser route.js (Route Handler), não page.jsx.
 * Retornar NextResponse de um Server Component (page.jsx) é inválido no
 * Next.js e causa o erro RSC: "Only plain objects can be passed to Client Components".
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const { token } = await params

  // Lê o HTML estático
  const htmlPath = join(process.cwd(), 'public', 'monitor', 'index.html')
  let html
  try {
    html = await readFile(htmlPath, 'utf-8')
  } catch {
    return new NextResponse('Monitor não encontrado', { status: 404 })
  }

  // Injeta o token como variável global JS antes do </head>
  const injection = `<script>window.__MONITOR_TOKEN__ = ${JSON.stringify(token)};</script>\n`
  html = html.replace('</head>', injection + '</head>')

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
