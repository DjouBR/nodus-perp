// MUI Imports
import { useTheme } from '@mui/material/styles'

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
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

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

        {/* Dashboard */}
        <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
          Dashboard
        </MenuItem>

        {/* Gestão */}
        <MenuSection label='Gestão'>
          <MenuItem href='/academies' icon={<i className='tabler-building-community' />}>
            Academias
          </MenuItem>
          <MenuItem href='/athletes' icon={<i className='tabler-users' />}>
            Atletas
          </MenuItem>
          <MenuItem href='/coaches' icon={<i className='tabler-user-star' />}>
            Coaches
          </MenuItem>
        </MenuSection>

        {/* Treino */}
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

        {/* Monitoramento */}
        <MenuSection label='Monitoramento'>
          <MenuItem href='/monitoring' icon={<i className='tabler-heart-rate-monitor' />}>
            Ao Vivo
          </MenuItem>
          <MenuItem href='/reports' icon={<i className='tabler-chart-bar' />}>
            Relatórios
          </MenuItem>
        </MenuSection>

        {/* Sistema */}
        <MenuSection label='Sistema'>
          <MenuItem href='/settings' icon={<i className='tabler-settings' />}>
            Configurações
          </MenuItem>
        </MenuSection>

      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
