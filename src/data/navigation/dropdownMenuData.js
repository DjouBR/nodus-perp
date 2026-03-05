// ─────────────────────────────────────────────────────────────────────────────
// NODUS — Menu Dropdown (avatar) por Role (8 roles)
// ─────────────────────────────────────────────────────────────────────────────

const dropdownByRole = {

  super_admin: [
    { label: 'Meu Perfil',     href: '/admin/profile',    icon: 'tabler-user' },
    { label: 'Configurações',  href: '/admin/settings',   icon: 'tabler-settings' },
  ],

  tenant_admin: [
    { label: 'Meu Perfil',       href: '/academy/profile',   icon: 'tabler-user' },
    { label: 'Minha Academia',   href: '/academy/config',    icon: 'tabler-building' },
    { label: 'Financeiro',       href: '/academy/financial', icon: 'tabler-cash' },
    { label: 'Configurações',    href: '/academy/config',    icon: 'tabler-settings' },
  ],

  academy_coach: [
    { label: 'Meu Perfil',      href: '/academy_coach/userprofile', icon: 'tabler-user' },
    { label: 'Mensagens',       href: '/academy_coach/messages',    icon: 'tabler-message' },
    { label: 'Configurações',   href: '/academy_coach/config',      icon: 'tabler-settings' },
  ],

  coach: [
    { label: 'Meu Perfil',     href: '/coach/userprofile', icon: 'tabler-user' },
    { label: 'Mensagens',      href: '/coach/messages',    icon: 'tabler-message' },
    { label: 'Financeiro',     href: '/coach/financial',   icon: 'tabler-cash' },
    { label: 'Configurações',  href: '/coach/config',      icon: 'tabler-settings' },
  ],

  receptionist: [
    { label: 'Meu Perfil',     href: '/recepcionist/userprofile', icon: 'tabler-user' },
    { label: 'Configurações',  href: '/recepcionist/config',      icon: 'tabler-settings' },
  ],

  academy_athlete: [
    { label: 'Meu Perfil',       href: '/academy_athlete/userprofile', icon: 'tabler-user' },
    { label: 'Mensagens',        href: '/academy_athlete/messages',    icon: 'tabler-message' },
    { label: 'Avaliação Física', href: '/academy_athlete/physical',    icon: 'tabler-clipboard-heart' },
    { label: 'Financeiro',       href: '/academy_athlete/financial',   icon: 'tabler-cash' },
    { label: 'Configurações',    href: '/academy_athlete/config',      icon: 'tabler-settings' },
  ],

  // Aluno do treinador independente
  coach_athlete: [
    { label: 'Meu Perfil',       href: '/coach_athlete/userprofile', icon: 'tabler-user' },
    { label: 'Mensagens',        href: '/coach_athlete/messages',    icon: 'tabler-message' },
    { label: 'Avaliação Física', href: '/coach_athlete/physical',    icon: 'tabler-clipboard-heart' },
    { label: 'Financeiro',       href: '/coach_athlete/financial',   icon: 'tabler-cash' },
    { label: 'Configurações',    href: '/coach_athlete/config',      icon: 'tabler-settings' },
  ],

  athlete: [
    { label: 'Meu Perfil',       href: '/athlete/userprofile', icon: 'tabler-user' },
    { label: 'Mensagens',        href: '/athlete/messages',    icon: 'tabler-message' },
    { label: 'Avaliação Física', href: '/athlete/physical',    icon: 'tabler-clipboard-heart' },
    { label: 'Configurações',    href: '/athlete/config',      icon: 'tabler-settings' },
  ],
}

/**
 * Retorna os itens do dropdown para o role informado.
 * @param {string} role - role do usuário logado
 * @returns {Array} itens do dropdown
 */
export const getDropdownMenuByRole = (role) => {
  return dropdownByRole[role] ?? dropdownByRole['academy_athlete']
}

export default dropdownByRole
