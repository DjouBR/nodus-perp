'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { useSettings } from '@core/hooks/useSettings'

const ROLE_LABELS = {
  super_admin:  'Super Admin',
  tenant_admin: 'Admin Academia',
  coach:        'Coach',
  receptionist: 'Recepcionista',
  athlete:      'Atleta',
}

const SETTINGS_URL = {
  super_admin:   '/admin/settings',
  tenant_admin:  '/academy/settings',
  coach:         '/coach/settings',
  athlete:       '/athlete/settings',
  receptionist:  '/receptionist/settings',
}

const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

function getInitials(name) {
  return name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'
}

const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}

const UserDropdown = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const router = useRouter()
  const { settings } = useSettings()
  const { data: session } = useSession()

  const user      = session?.user
  const roleName  = ROLE_LABELS[user?.role] ?? user?.role ?? ''
  const settingsUrl = SETTINGS_URL[user?.role] ?? '/profile'

  const handleDropdownOpen = () => setOpen(o => !o)

  const handleDropdownClose = (event, url) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target)) return
    setOpen(false)
    if (url) router.push(url)
  }

  const handleUserLogout = async () => {
    setOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  const AvatarEl = ({ size = 38 }) => user?.avatar ? (
    <Avatar alt={user.name} src={user.avatar}
      sx={size !== 38 ? {} : { width: size, height: size }} />
  ) : (
    <Avatar sx={{ width: size, height: size, backgroundColor: avatarColor(user?.name), color: '#fff', fontSize: size === 38 ? '0.875rem' : '1rem', fontWeight: 700 }}>
      {getInitials(user?.name)}
    </Avatar>
  )

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <AvatarEl size={38} />
      </Badge>
      {/* wrapper invisível para capturar o click no badge */}
      <span ref={anchorRef} onClick={handleDropdownOpen} style={{ position: 'absolute', width: 38, height: 38, cursor: 'pointer', opacity: 0 }} />

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e)}>
                <MenuList>

                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <AvatarEl size={40} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {user?.name ?? 'Usuário'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>{roleName}</Typography>
                      <Typography variant='caption' color='text.disabled' sx={{ fontSize: '0.65rem' }}>
                        {user?.email}
                      </Typography>
                    </div>
                  </div>

                  <Divider className='mlb-1' />

                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/profile')}>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>Meu Perfil</Typography>
                  </MenuItem>

                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, settingsUrl)}>
                    <i className='tabler-settings' />
                    <Typography color='text.primary'>Configurações</Typography>
                  </MenuItem>

                  {user?.role !== 'athlete' && (
                    <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/athletes')}>
                      <i className='tabler-users' />
                      <Typography color='text.primary'>Atletas</Typography>
                    </MenuItem>
                  )}

                  <Divider className='mlb-1' />

                  <div className='flex items-center plb-2 pli-3'>
                    <Button fullWidth variant='contained' color='error' size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}>
                      Sair
                    </Button>
                  </div>

                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
