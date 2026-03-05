'use client'
import { useSession } from 'next-auth/react'

// ─────────────────────────────────────────────────────────────────────────────
// NODUS — Menu Lateral por Role (8 roles)
// ─────────────────────────────────────────────────────────────────────────────

const menuByRole = {

  // ── Super Admin ───────────────────────────────────────────────────────────
  super_admin: [
    { label: 'Dashboard', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Plataforma' },
    { label: 'Tenants',       href: '/admin/tenants',    icon: 'tabler-building-skyscraper' },
    { label: 'Planos',        href: '/admin/plans',      icon: 'tabler-credit-card' },
    { label: 'Financeiro',    href: '/admin/financial',  icon: 'tabler-cash' },
    { label: 'Usuários',      href: '/admin/users',      icon: 'tabler-users' },
    { isSection: true, label: 'Sistema' },
    { label: 'Monitoramento', href: '/admin/monitoring', icon: 'tabler-heart-rate-monitor' },
    { label: 'Logs',          href: '/admin/logs',       icon: 'tabler-clipboard-list' },
    { label: 'Configurações', href: '/admin/settings',   icon: 'tabler-settings' },
  ],

  // ── Tenant Admin (gestor de academia) ─────────────────────────────────────
  tenant_admin: [
    { label: 'Dashboard', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Gestão' },
    { label: 'Atletas',        href: '/athletes',        icon: 'tabler-users' },
    { label: 'Professores',    href: '/coaches',         icon: 'tabler-user-star' },
    { label: 'Recepcionistas', href: '/academy/staff',   icon: 'tabler-user-check' },
    { isSection: true, label: 'Treino' },
    { label: 'Sessões',        href: '/sessions',        icon: 'tabler-activity' },
    { label: 'Planejamento',   href: '/planning',        icon: 'tabler-calendar-stats' },
    { isSection: true, label: 'Monitoramento' },
    { label: 'Ao Vivo',        href: '/monitoring',      icon: 'tabler-heart-rate-monitor' },
    { label: 'Relatórios',     href: '/reports',         icon: 'tabler-chart-bar' },
    { isSection: true, label: 'Academia' },
    { label: 'Financeiro',     href: '/academy/financial', icon: 'tabler-cash' },
    { label: 'Configurações',  href: '/academy/config',   icon: 'tabler-settings' },
  ],

  // ── Academy Coach (professor funcionário) ─────────────────────────────────
  academy_coach: [
    { label: 'Dashboard', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Atletas' },
    { label: 'Meus Atletas',   href: '/athletes',                icon: 'tabler-users' },
    { isSection: true, label: 'Treino' },
    { label: 'Sessões',        href: '/sessions',                icon: 'tabler-activity' },
    { label: 'Planejamento',   href: '/planning',                icon: 'tabler-calendar-stats' },
    { label: 'Daily Logs',     href: '/daily-logs',              icon: 'tabler-clipboard-text' },
    { isSection: true, label: 'Monitoramento' },
    { label: 'Ao Vivo',        href: '/monitoring',              icon: 'tabler-heart-rate-monitor' },
    { label: 'Relatórios',     href: '/reports',                 icon: 'tabler-chart-bar' },
    { isSection: true, label: 'Pessoal' },
    { label: 'Configurações',  href: '/academy_coach/config',    icon: 'tabler-settings' },
  ],

  // ── Coach Independente ────────────────────────────────────────────────────
  coach: [
    { label: 'Dashboard', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Alunos' },
    { label: 'Meus Alunos',    href: '/coach/athletes',          icon: 'tabler-users' }, // rota própria
    { isSection: true, label: 'Treino' },
    { label: 'Sessões',        href: '/sessions',                icon: 'tabler-activity' },
    { label: 'Planejamento',   href: '/planning',                icon: 'tabler-calendar-stats' },
    { label: 'Daily Logs',     href: '/daily-logs',              icon: 'tabler-clipboard-text' },
    { isSection: true, label: 'Monitoramento' },
    { label: 'Ao Vivo',        href: '/monitoring',              icon: 'tabler-heart-rate-monitor' },
    { label: 'Relatórios',     href: '/reports',                 icon: 'tabler-chart-bar' },
    { isSection: true, label: 'Pessoal' },
    { label: 'Configurações',  href: '/coach/config',            icon: 'tabler-settings' },
  ],

  // ── Recepcionista ─────────────────────────────────────────────────────────
  receptionist: [
    { label: 'Dashboard', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Operações' },
    { label: 'Atletas',        href: '/athletes',                icon: 'tabler-users' },
    { label: 'Check-in',       href: '/recepcionist/checkin',    icon: 'tabler-scan' },
    { label: 'Sessões',        href: '/sessions',                icon: 'tabler-activity' },
    { isSection: true, label: 'Financeiro' },
    { label: 'Pagamentos',     href: '/recepcionist/payments',   icon: 'tabler-cash' },
    { isSection: true, label: 'Pessoal' },
    { label: 'Configurações',  href: '/recepcionist/config',     icon: 'tabler-settings' },
  ],

  // ── Aluno de Academia ─────────────────────────────────────────────────────
  academy_athlete: [
    { label: 'Início', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Treino' },
    { label: 'Monitoramento',      href: '/academy_athlete/monitoring',   icon: 'tabler-heart-rate-monitor' },
    { label: 'Meu Treino',         href: '/academy_athlete/prescription', icon: 'tabler-barbell' },
    { label: 'Pré Treino',         href: '/academy_athlete/preworkout',   icon: 'tabler-run' },
    { label: 'Pós Treino',         href: '/academy_athlete/postworkout',  icon: 'tabler-armchair' },
    { isSection: true, label: 'Histórico' },
    { label: 'Histórico de Treinos', href: '/academy_athlete/history',      icon: 'tabler-history' },
    { label: 'Minha Evolução',     href: '/academy_athlete/evolution',    icon: 'tabler-trending-up' },
    { isSection: true, label: 'Diversos' },
    { label: 'Configurações',      href: '/academy_athlete/config',       icon: 'tabler-settings' },
  ],

  // ── Aluno do Treinador Independente ──────────────────────────────────────
  coach_athlete: [
    { label: 'Início', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Treino' },
    { label: 'Monitoramento',      href: '/coach_athlete/monitoring',   icon: 'tabler-heart-rate-monitor' },
    { label: 'Meu Treino',         href: '/coach_athlete/prescription', icon: 'tabler-barbell' },
    { label: 'Pré Treino',         href: '/coach_athlete/preworkout',   icon: 'tabler-run' },
    { label: 'Pós Treino',         href: '/coach_athlete/postworkout',  icon: 'tabler-armchair' },
    { isSection: true, label: 'Histórico' },
    { label: 'Histórico de Treinos', href: '/coach_athlete/history',      icon: 'tabler-history' },
    { label: 'Minha Evolução',     href: '/coach_athlete/evolution',    icon: 'tabler-trending-up' },
    { isSection: true, label: 'Diversos' },
    { label: 'Configurações',      href: '/coach_athlete/config',       icon: 'tabler-settings' },
  ],

  // ── Atleta Independente (sem vínculo) ─────────────────────────────────────
  athlete: [
    { label: 'Início', href: '/home', icon: 'tabler-smart-home' },
    { isSection: true, label: 'Treino' },
    { label: 'Monitoramento',      href: '/athlete/monitoring',   icon: 'tabler-heart-rate-monitor' },
    { label: 'Meu Treino',         href: '/athlete/prescription', icon: 'tabler-barbell' },
    { label: 'Pré Treino',         href: '/athlete/preworkout',   icon: 'tabler-run' },
    { label: 'Pós Treino',         href: '/athlete/postworkout',  icon: 'tabler-armchair' },
    { isSection: true, label: 'Histórico' },
    { label: 'Histórico de Treinos', href: '/athlete/history',      icon: 'tabler-history' },
    { label: 'Minha Evolução',     href: '/athlete/evolution',    icon: 'tabler-trending-up' },
    { isSection: true, label: 'Diversos' },
    { label: 'Configurações',      href: '/athlete/config',       icon: 'tabler-settings' },
  ],
}

const verticalMenuData = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: session } = useSession()
  const role = session?.user?.role
  return menuByRole[role] ?? menuByRole['academy_athlete']
}

export default verticalMenuData
