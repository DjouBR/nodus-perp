'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const { settings } = useSettings()

  const handleToggle = () => setOpen(o => !o)
  const handleClose = () => setOpen(false)

  return (
    <>
      <Tooltip title='Notificações'>
        <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
          <i className='tabler-bell' />
        </IconButton>
      </Tooltip>

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[280px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <Box className='p-4 flex flex-col items-center gap-2'>
                  <i className='tabler-bell-off text-3xl text-textDisabled' />
                  <Typography variant='body2' color='text.secondary'>
                    Nenhuma notificação por enquanto.
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    🚧 Módulo de notificações em breve.
                  </Typography>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationsDropdown
