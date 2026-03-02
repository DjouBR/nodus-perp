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

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { data: session } = useSession()

  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const role = session?.user?.role ?? 'athlete'

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? { className: 'bs-full overflow-y-auto overflow-x-hidden', onScroll: container => scrollMenu(container, false) }
        : { options: { wheelPropagation: false, suppressScrollX: true }, onScrollY: container => scrollMenu(container, true) }
      )}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >

        {/* ═══════════════════════════════════════════════════════════════
            SUPER ADMIN
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'super_admin' && (
          <>
            <MenuItem href='/admin/dashboard' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>

            <MenuSection label='Gestão'>
              <MenuItem href='/admin/clients' icon={<i className='tabler-building-community' />}>
                Clientes
              </MenuItem>
              <MenuItem href='/admin/crm' icon={<i className='tabler-address-book' />}>
                CRM
              </MenuItem>
            </MenuSection>

            <MenuSection label='Planos / Assinaturas'>
              <MenuItem href='/admin/plans' icon={<i className='tabler-credit-card' />}>
                Planos
              </MenuItem>
              <MenuItem href='/admin/paymenthistory' icon={<i className='tabler-receipt' />}>
                Histórico de Cobranças
              </MenuItem>
            </MenuSection>

            <MenuSection label='Financeiro'>
              <MenuItem href='/admin/financial' icon={<i className='tabler-chart-pie' />}>
                Dashboard
              </MenuItem>
              <MenuItem href='/admin/cashflow' icon={<i className='tabler-cash' />}>
                Receitas / Despesas
              </MenuItem>
            </MenuSection>

            <MenuSection label='Monitoramento'>
              <MenuItem href='/admin/monitoring' icon={<i className='tabler-activity' />}>
                Dashboard
              </MenuItem>
              <MenuItem href='/admin/requests' icon={<i className='tabler-inbox' />}>
                Solicitações
              </MenuItem>
              <MenuItem href='/admin/systemlogs' icon={<i className='tabler-terminal-2' />}>
                Logs do Sistema
              </MenuItem>
            </MenuSection>

            <MenuItem href='/admin/settings' icon={<i className='tabler-settings' />}>
              Configurações
            </MenuItem>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TENANT ADMIN — placeholder até ditar o menu
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'tenant_admin' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Gestão'>
              <MenuItem href='/athletes' icon={<i className='tabler-users' />}>Atletas</MenuItem>
              <MenuItem href='/coaches' icon={<i className='tabler-user-star' />}>Coaches</MenuItem>
            </MenuSection>
            <MenuSection label='Treino'>
              <MenuItem href='/sessions' icon={<i className='tabler-activity' />}>Sessões</MenuItem>
              <MenuItem href='/planning' icon={<i className='tabler-calendar-stats' />}>Planejamento</MenuItem>
            </MenuSection>
            <MenuSection label='Monitoramento'>
              <MenuItem href='/monitoring' icon={<i className='tabler-heart-rate-monitor' />}>Ao Vivo</MenuItem>
              <MenuItem href='/reports' icon={<i className='tabler-chart-bar' />}>Relatórios</MenuItem>
            </MenuSection>
            <MenuItem href='/academy/settings' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            COACH — placeholder até ditar o menu
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'coach' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Atletas'>
              <MenuItem href='/athletes' icon={<i className='tabler-users' />}>Meus Atletas</MenuItem>
            </MenuSection>
            <MenuSection label='Treino'>
              <MenuItem href='/sessions' icon={<i className='tabler-activity' />}>Sessões</MenuItem>
              <MenuItem href='/planning' icon={<i className='tabler-calendar-stats' />}>Planejamento</MenuItem>
              <MenuItem href='/daily-logs' icon={<i className='tabler-clipboard-text' />}>Daily Logs</MenuItem>
            </MenuSection>
            <MenuSection label='Monitoramento'>
              <MenuItem href='/monitoring' icon={<i className='tabler-heart-rate-monitor' />}>Ao Vivo</MenuItem>
              <MenuItem href='/reports' icon={<i className='tabler-chart-bar' />}>Relatórios</MenuItem>
            </MenuSection>
            <MenuItem href='/coach/settings' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            RECEPTIONIST — placeholder até ditar o menu
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'receptionist' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Recepção'>
              <MenuItem href='/athletes' icon={<i className='tabler-users' />}>Atletas</MenuItem>
              <MenuItem href='/checkin' icon={<i className='tabler-scan' />}>Check-in</MenuItem>
              <MenuItem href='/payments' icon={<i className='tabler-cash' />}>Pagamentos</MenuItem>
            </MenuSection>
            <MenuItem href='/receptionist/settings' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ATHLETE — placeholder até ditar o menu
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'athlete' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Meu Treino'>
              <MenuItem href='/my-training' icon={<i className='tabler-barbell' />}>Meu Plano</MenuItem>
              <MenuItem href='/daily-logs' icon={<i className='tabler-clipboard-text' />}>Daily Log</MenuItem>
              <MenuItem href='/my-history' icon={<i className='tabler-history' />}>Meu Histórico</MenuItem>
            </MenuSection>
            <MenuSection label='Evolução'>
              <MenuItem href='/my-stats' icon={<i className='tabler-chart-line' />}>Minha Evolução</MenuItem>
              <MenuItem href='/gamification' icon={<i className='tabler-trophy' />}>Ranking e Badges</MenuItem>
            </MenuSection>
            <MenuItem href='/athlete/settings' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
          </>
        )}

      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
