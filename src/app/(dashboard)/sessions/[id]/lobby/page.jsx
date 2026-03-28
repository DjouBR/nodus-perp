/**
 * src/app/(dashboard)/sessions/[id]/lobby/page.jsx
 *
 * Tela 1 — Sala de Espera
 * Rota: /sessions/[id]/lobby
 * Acesso: STAFF_ROLES (coach, tenant_admin, academy_coach, receptionist)
 */

import LobbyView from '@/views/sessions/lobby/LobbyView'

export const metadata = {
  title: 'NODUS — Sala de Espera',
}

export default async function LobbyPage({ params }) {
  const { id } = await params
  return <LobbyView sessionId={id} />
}
