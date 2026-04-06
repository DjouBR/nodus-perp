/**
 * src/app/monitor/[token]/page.jsx
 *
 * Rota pública Next.js que serve o monitor.html para Smart TV / tablet.
 * Sem header/sidebar do Vuexy — tela cheia pura.
 *
 * Estratégia:
 *   - Lê o HTML estático de public/monitor/index.html
 *   - Injeta window.__MONITOR_TOKEN__ = '<token>' antes do </head>
 *   - Serve o HTML diretamente como Response (sem redirect)
 *
 * Isso resolve o bug onde PAGE_TOKEN era sempre null porque o redirect
 * anterior usava hash (#token) e getTokenFromUrl() só lia pathname.
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function generateStaticParams() {
  return []
}

export default async function MonitorPage({ params }) {
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
