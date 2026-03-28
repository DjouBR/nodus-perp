/**
 * src/app/monitor/[token]/page.jsx
 *
 * Rota pública Next.js que serve o monitor.html para Smart TV / tablet.
 * Não tem header/sidebar do Vuexy — tela cheia pura.
 *
 * Estratégia:
 *   - O Next.js renderiza esta página sem autenticação (middleware liberado para /monitor/*)
 *   - A página apenas carrega o HTML estático de public/monitor/index.html via redirect,
 *     mantendo o token na URL para o JS do monitor fazer fetch em /api/monitor/[token]
 *
 * Alternativa (usada aqui): redirecionar para /monitor/index.html?token=[token]
 * para manter 100% do HTML standalone sem Server Components.
 */

import { redirect } from 'next/navigation'

export default async function MonitorPage({ params }) {
  const { token } = await params
  // Redireciona para o HTML puro em public/, passando o token como parte do path
  // O JS do monitor.html lê o token de window.location.pathname
  redirect(`/monitor/index.html#${token}`)
}
