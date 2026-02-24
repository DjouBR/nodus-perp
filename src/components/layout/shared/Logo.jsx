'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Third-party Imports
import styled from '@emotion/styled'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const LogoText = styled.span`
  color: ${({ color }) => color ?? 'var(--mui-palette-text-primary)'};
  font-size: 1.375rem;
  line-height: 1.09091;
  font-weight: 700;
  letter-spacing: 0.25px;
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed, isBreakpointReached }) =>
    !isBreakpointReached && isCollapsed && !isHovered
      ? 'opacity: 0; margin-inline-start: 0;'
      : 'opacity: 1; margin-inline-start: 12px;'}
`

const NodusIcon = () => (
  <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='14' cy='14' r='14' fill='var(--mui-palette-primary-main)' />
    <path
      d='M8 19V9l4 5 4-5v10'
      stroke='white'
      strokeWidth='2.2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='20' cy='14' r='2' fill='white' />
  </svg>
)

const Logo = ({ color }) => {
  const logoTextRef = useRef(null)
  const { isHovered, transitionDuration, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()
  const { layout } = settings

  useEffect(() => {
    if (layout !== 'collapsed') return
    if (logoTextRef && logoTextRef.current) {
      if (!isBreakpointReached && layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
  }, [isHovered, layout, isBreakpointReached])

  return (
    <div className='flex items-center'>
      <NodusIcon />
      <LogoText
        color={color}
        ref={logoTextRef}
        isHovered={isHovered}
        isCollapsed={layout === 'collapsed'}
        transitionDuration={transitionDuration}
        isBreakpointReached={isBreakpointReached}
      >
        NODUS
      </LogoText>
    </div>
  )
}

export default Logo
