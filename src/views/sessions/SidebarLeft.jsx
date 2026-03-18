'use client'

import { useEffect } from 'react'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import classnames from 'classnames'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { registerLocale, setDefaultLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale/pt-BR'

registerLocale('pt-BR', ptBR)
setDefaultLocale('pt-BR')

export default function SidebarLeft({
  mdAbove,
  leftSidebarOpen,
  sessionTypes,
  activeTypes,
  setActiveTypes,
  calendarRef,
  handleLeftSidebarToggle,
  handleNewSession,
}) {
  const allChecked = sessionTypes.length > 0 && activeTypes.length === sessionTypes.length

  const toggleAll = checked => setActiveTypes(checked ? sessionTypes.map(t => t.id) : [])
  const toggleType = id => setActiveTypes(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const handleDateChange = date => {
    const api = calendarRef?.current?.getApi()
    if (api && date) api.gotoDate(date)
  }

  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant={mdAbove ? 'permanent' : 'temporary'}
      ModalProps={{
        disablePortal:      true,
        disableAutoFocus:   true,
        disableScrollLock:  true,
        keepMounted:        true,
      }}
      className={classnames('block', { static: mdAbove, absolute: !mdAbove })}
      slotProps={{
        paper: {
          className: classnames(
            'items-start is-[280px] shadow-none rounded rounded-se-none rounded-ee-none overflow-y-auto',
            { static: mdAbove, absolute: !mdAbove }
          ),
        },
      }}
      sx={{
        zIndex: 3,
        '& .MuiDrawer-paper': { zIndex: mdAbove ? 2 : 'drawer' },
        '& .MuiBackdrop-root': { borderRadius: 1, position: 'absolute' },
      }}
    >
      {/* Botão nova sessão */}
      <div className='is-full p-6'>
        <Button
          fullWidth
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={handleNewSession}
        >
          Nova Sessão
        </Button>
      </div>

      <Divider className='is-full' />

      {/* Mini-calendário: react-datepicker inline com locale pt-BR */}
      <AppReactDatepicker
        inline
        locale='pt-BR'
        onChange={handleDateChange}
        boxProps={{
          className: 'flex justify-center is-full',
          sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
        }}
      />

      <Divider className='is-full' />

      {/* Filtros por tipo de sessão */}
      <div className='flex flex-col p-6 is-full'>
        <Typography variant='h6' className='mbe-4'>
          Tipos de Sessão
        </Typography>

        {sessionTypes.length > 0 && (
          <FormControlLabel
            className='mbe-1'
            label='Ver todos'
            control={
              <Checkbox
                checked={allChecked}
                indeterminate={activeTypes.length > 0 && !allChecked}
                onChange={e => toggleAll(e.target.checked)}
              />
            }
          />
        )}

        {sessionTypes.map(type => (
          <FormControlLabel
            key={type.id}
            className='mbe-1'
            label={type.name}
            control={
              <Checkbox
                checked={activeTypes.includes(type.id)}
                onChange={() => toggleType(type.id)}
                sx={{ color: type.color, '&.Mui-checked': { color: type.color } }}
              />
            }
          />
        ))}

        {sessionTypes.length === 0 && (
          <Typography variant='body2' color='textSecondary'>
            Nenhum tipo cadastrado ainda.
          </Typography>
        )}
      </div>
    </Drawer>
  )
}
