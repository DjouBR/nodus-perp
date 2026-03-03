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
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Gestão'>
              <MenuItem href='/admin/clients' icon={<i className='tabler-building-community' />}>Clientes</MenuItem>
              <MenuItem href='/admin/crm' icon={<i className='tabler-address-book' />}>CRM</MenuItem>
            </MenuSection>
            <MenuSection label='Planos / Assinaturas'>
              <MenuItem href='/admin/plans' icon={<i className='tabler-credit-card' />}>Planos</MenuItem>
              <MenuItem href='/admin/paymenthistory' icon={<i className='tabler-receipt' />}>Histórico de Cobranças</MenuItem>
            </MenuSection>
            <MenuSection label='Financeiro'>
              <MenuItem href='/admin/financial' icon={<i className='tabler-chart-pie' />}>Dashboard</MenuItem>
              <MenuItem href='/admin/cashflow' icon={<i className='tabler-cash' />}>Receitas / Despesas</MenuItem>
            </MenuSection>
            <MenuSection label='Monitoramento'>
              <MenuItem href='/admin/monitoring' icon={<i className='tabler-activity' />}>Dashboard</MenuItem>
              <MenuItem href='/admin/requests' icon={<i className='tabler-inbox' />}>Solicitações</MenuItem>
              <MenuItem href='/admin/systemlogs' icon={<i className='tabler-terminal-2' />}>Logs do Sistema</MenuItem>
            </MenuSection>
            <MenuItem href='/admin/settings' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACADEMIA / EQUIPES (tenant_admin)
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'tenant_admin' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Cadastro'>
              <MenuItem href='/academy/coaches' icon={<i className='tabler-user-star' />}>Treinadores / Professores</MenuItem>
              <MenuItem href='/academy/athletes' icon={<i className='tabler-users' />}>Atletas / Alunos</MenuItem>
              <MenuItem href='/academy/recepcionist' icon={<i className='tabler-headset' />}>Recepção</MenuItem>
            </MenuSection>
            <MenuSection label='Sessões de Treino'>
              <MenuItem href='/academy/calendar' icon={<i className='tabler-calendar' />}>Agenda</MenuItem>
              <MenuItem href='/academy/sessionshistory' icon={<i className='tabler-history' />}>Histórico de Treinos</MenuItem>
            </MenuSection>
            <MenuSection label='Monitoramento'>
              <MenuItem href='/academy/tvscreen' icon={<i className='tabler-device-tv' />}>Exibição TV</MenuItem>
              <MenuItem href='/academy/tvoptions' icon={<i className='tabler-adjustments-horizontal' />}>Opções de Exibição</MenuItem>
            </MenuSection>
            <MenuSection label='Diversos'>
              <MenuItem href='/academy/report' icon={<i className='tabler-chart-bar' />}>Relatórios</MenuItem>
              <MenuItem href='/academy/gamification' icon={<i className='tabler-trophy' />}>Gamificação</MenuItem>
              <MenuItem href='/academy/config' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
            </MenuSection>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            COACH INDEPENDENTE
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'coach' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuSection label='Cadastro'>
              <MenuItem href='/coach/athletes' icon={<i className='tabler-users' />}>Atletas / Alunos</MenuItem>
            </MenuSection>
            <MenuSection label='Sessões de Treino'>
              <MenuItem href='/coach/calendar' icon={<i className='tabler-calendar' />}>Agenda</MenuItem>
              <MenuItem href='/coach/sessionshistory' icon={<i className='tabler-history' />}>Histórico de Treinos</MenuItem>
            </MenuSection>
            <MenuSection label='Prescrição de Treino'>
              <MenuItem href='/coach/planning' icon={<i className='tabler-calendar-stats' />}>Planejamento</MenuItem>
              <MenuItem href='/coach/prescription' icon={<i className='tabler-clipboard-text' />}>Prescrição</MenuItem>
            </MenuSection>
            <MenuSection label='Monitoramento'>
              <MenuItem href='/coach/monitoring' icon={<i className='tabler-heart-rate-monitor' />}>Tempo Real</MenuItem>
              <MenuItem href='/coach/monitoringoptions' icon={<i className='tabler-adjustments-horizontal' />}>Opções de Exibição</MenuItem>
            </MenuSection>
            <MenuSection label='Diversos'>
              <MenuItem href='/coach/report' icon={<i className='tabler-chart-bar' />}>Relatórios</MenuItem>
              <MenuItem href='/coach/gamification' icon={<i className='tabler-trophy' />}>Gamificação</MenuItem>
              <MenuItem href='/coach/config' icon={<i className='tabler-settings' />}>Configurações</MenuItem>
            </MenuSection>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            RECEPTIONIST — placeholder até ditar o menu
        ═══════════════════════════════════════════════════════════════ */}
        {role === 'receptionist' && (
          <>
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>Dashboard</MenuItem>
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
            <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>Dashboard</MenuItem>
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
