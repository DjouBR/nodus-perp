'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// NextAuth
import { useSession } from 'next-auth/react'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

// ─── Definição de acesso por role ─────────────────────────────────────────────
const can = (role, allowedRoles) => allowedRoles.includes(role)

const ROLES = {
  SUPER_ADMIN:  'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  COACH:        'coach',
  ATHLETE:      'athlete',
  RECEPTIONIST: 'receptionist'
}

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { data: session } = useSession()

  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Role do usuário logado (fallback: athlete para segurança)
  const role = session?.user?.role ?? 'athlete'

  // ─── Helpers de permissão ────────────────────────────────────────────────────
  const isAdmin      = can(role, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN])
  const isCoach      = can(role, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN, ROLES.COACH])
  const isReception  = can(role, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN, ROLES.RECEPTIONIST])
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const isAthlete    = role === ROLES.ATHLETE

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >

        {/* ── Dashboard ── visível para todos ─────────────────────────────── */}
        <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
          Dashboard
        </MenuItem>

        {/* ── SUPER ADMIN exclusivo ──────────────────────────────────────── */}
        {isSuperAdmin && (
          <MenuSection label='Administração'>
            <MenuItem href='/admin/dashboard' icon={<i className='tabler-layout-dashboard' />}>
              Painel Global
            </MenuItem>
            <MenuItem href='/admin/tenants' icon={<i className='tabler-building-skyscraper' />}>
              Tenants
            </MenuItem>
            <MenuItem href='/admin/plans' icon={<i className='tabler-credit-card' />}>
              Planos
            </MenuItem>
            <MenuItem href='/admin/system' icon={<i className='tabler-server' />}>
              Sistema
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Gestão: Admin + Recepção ──────────────────────────────────── */}
        {(isAdmin || isReception) && (
          <MenuSection label='Gestão'>
            {isAdmin && (
              <MenuItem href='/academies' icon={<i className='tabler-building-community' />}>
                Academias
              </MenuItem>
            )}
            <MenuItem href='/athletes' icon={<i className='tabler-users' />}>
              Atletas
            </MenuItem>
            {isAdmin && (
              <MenuItem href='/coaches' icon={<i className='tabler-user-star' />}>
                Coaches
              </MenuItem>
            )}
          </MenuSection>
        )}

        {/* ── Treino: Coach + Admin ──────────────────────────────────────── */}
        {isCoach && (
          <MenuSection label='Treino'>
            <MenuItem href='/sessions' icon={<i className='tabler-activity' />}>
              Sessões
            </MenuItem>
            <MenuItem href='/daily-logs' icon={<i className='tabler-clipboard-text' />}>
              Daily Logs
            </MenuItem>
            <MenuItem href='/planning' icon={<i className='tabler-calendar-stats' />}>
              Planejamento
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Monitoramento: Coach + Admin ───────────────────────────────── */}
        {isCoach && (
          <MenuSection label='Monitoramento'>
            <MenuItem href='/monitoring' icon={<i className='tabler-heart-rate-monitor' />}>
              Ao Vivo
            </MenuItem>
            <MenuItem href='/reports' icon={<i className='tabler-chart-bar' />}>
              Relatórios
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Atleta: menu pessoal ───────────────────────────────────────── */}
        {isAthlete && (
          <MenuSection label='Meu Treino'>
            <MenuItem href='/my-training' icon={<i className='tabler-barbell' />}>
              Meu Plano
            </MenuItem>
            <MenuItem href='/daily-logs' icon={<i className='tabler-clipboard-text' />}>
              Daily Log
            </MenuItem>
            <MenuItem href='/my-history' icon={<i className='tabler-history' />}>
              Meu Histórico
            </MenuItem>
          </MenuSection>
        )}

        {isAthlete && (
          <MenuSection label='Evolução'>
            <MenuItem href='/my-stats' icon={<i className='tabler-chart-line' />}>
              Minha Evolução
            </MenuItem>
            <MenuItem href='/gamification' icon={<i className='tabler-trophy' />}>
              Ranking e Badges
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Recepção: financeiro limitado ─────────────────────────────── */}
        {role === ROLES.RECEPTIONIST && (
          <MenuSection label='Recepção'>
            <MenuItem href='/checkin' icon={<i className='tabler-scan' />}>
              Check-in
            </MenuItem>
            <MenuItem href='/payments' icon={<i className='tabler-cash' />}>
              Pagamentos
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Sistema: apenas Admin ─────────────────────────────────────── */}
        {isAdmin && (
          <MenuSection label='Sistema'>
            <MenuItem href='/settings' icon={<i className='tabler-settings' />}>
              Configurações
            </MenuItem>
          </MenuSection>
        )}

        {/* ── Perfil: todos ─────────────────────────────────────────────── */}
        <MenuSection label='Conta'>
          <MenuItem href='/profile' icon={<i className='tabler-user-circle' />}>
            Meu Perfil
          </MenuItem>
        </MenuSection>

      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
