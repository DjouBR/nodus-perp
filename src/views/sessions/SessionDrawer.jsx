'use client'

import { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CustomTextField from '@core/components/mui/TextField'

const STATUS_LABELS = {
  scheduled: { label: 'Agendada', color: 'primary' },
  active:    { label: 'Em andamento', color: 'success' },
  finished:  { label: 'Finalizada', color: 'default' },
  cancelled: { label: 'Cancelada', color: 'error' },
}

const DEFAULT_VALUES = {
  name: '',
  session_type_id: '',
  start_datetime: '',
  duration_min: 60,
  capacity: 30,
  target_zone_min: 2,
  target_zone_max: 4,
  notes: '',
  status: 'scheduled',
}

export default function SessionDrawer({
  open,
  session,
  sessionTypes,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}) {
  const isEdit = !!session?.id
  const [form, setForm] = useState(DEFAULT_VALUES)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Pré-preenche o form ao abrir
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      const start = session.start_datetime
        ? new Date(session.start_datetime).toISOString().slice(0, 16)
        : ''
      setForm({
        id:              session.id,
        name:            session.name || '',
        session_type_id: session.session_type_id || '',
        start_datetime:  start,
        duration_min:    session.duration_min || 60,
        capacity:        session.capacity || 30,
        target_zone_min: session.target_zone_min ?? 2,
        target_zone_max: session.target_zone_max ?? 4,
        notes:           session.notes || '',
        status:          session.status || 'scheduled',
      })
    } else {
      const baseDate = defaultDate
        ? `${defaultDate}T08:00`
        : new Date().toISOString().slice(0, 16)
      setForm({ ...DEFAULT_VALUES, start_datetime: baseDate })
    }
    setConfirmDelete(false)
  }, [open, isEdit, session, defaultDate])

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.start_datetime) return
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    await onDelete(form.id)
    setLoading(false)
  }

  const statusInfo = STATUS_LABELS[form.status] || STATUS_LABELS.scheduled

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 420] } }}
    >
      {/* Header */}
      <Box className='flex justify-between items-center plb-5 pli-6 border-be'>
        <div className='flex items-center gap-2'>
          <Typography variant='h5'>
            {isEdit ? 'Editar Sessão' : 'Nova Sessão'}
          </Typography>
          {isEdit && (
            <Chip
              size='small'
              label={statusInfo.label}
              color={statusInfo.color}
            />
          )}
        </div>
        <Box className='flex items-center gap-1'>
          {isEdit && (
            <IconButton
              size='small'
              color={confirmDelete ? 'error' : 'default'}
              onClick={handleDelete}
              title={confirmDelete ? 'Confirmar cancelamento' : 'Cancelar sessão'}
            >
              <i className={`tabler-trash text-xl ${confirmDelete ? 'text-error' : 'text-textPrimary'}`} />
            </IconButton>
          )}
          <IconButton size='small' onClick={onClose}>
            <i className='tabler-x text-xl text-textPrimary' />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box className='overflow-y-auto' sx={{ p: 3, flex: 1 }}>
        <div className='flex flex-col gap-5'>

          {/* Nome */}
          <CustomTextField
            fullWidth
            required
            label='Nome da sessão'
            placeholder='ex: Aula de Spinning — Turma Manhã'
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
          />

          {/* Tipo de sessão */}
          <CustomTextField
            select
            fullWidth
            label='Tipo de sessão'
            value={form.session_type_id}
            onChange={e => handleChange('session_type_id', e.target.value)}
          >
            <MenuItem value=''>— Sem tipo —</MenuItem>
            {sessionTypes.map(t => (
              <MenuItem key={t.id} value={t.id}>
                <span className='flex items-center gap-2'>
                  {t.icon && <i className={`tabler-${t.icon}`} style={{ color: t.color }} />}
                  {t.name}
                </span>
              </MenuItem>
            ))}
          </CustomTextField>

          {/* Data e hora */}
          <CustomTextField
            fullWidth
            required
            type='datetime-local'
            label='Data e hora de início'
            value={form.start_datetime}
            onChange={e => handleChange('start_datetime', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Duração */}
          <CustomTextField
            fullWidth
            type='number'
            label='Duração (minutos)'
            value={form.duration_min}
            onChange={e => handleChange('duration_min', Number(e.target.value))}
            inputProps={{ min: 5, step: 5 }}
          />

          {/* Capacidade */}
          <CustomTextField
            fullWidth
            type='number'
            label='Capacidade máxima (atletas)'
            value={form.capacity}
            onChange={e => handleChange('capacity', Number(e.target.value))}
            inputProps={{ min: 1 }}
          />

          <Divider />

          {/* Zonas alvo */}
          <Typography variant='subtitle2' color='textSecondary'>
            Zonas de FC alvo
          </Typography>
          <div className='flex gap-4'>
            <CustomTextField
              fullWidth
              select
              label='Zona mínima'
              value={form.target_zone_min}
              onChange={e => handleChange('target_zone_min', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(z => (
                <MenuItem key={z} value={z}>Z{z}</MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              fullWidth
              select
              label='Zona máxima'
              value={form.target_zone_max}
              onChange={e => handleChange('target_zone_max', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(z => (
                <MenuItem key={z} value={z}>Z{z}</MenuItem>
              ))}
            </CustomTextField>
          </div>

          {/* Status — só exibe no edit */}
          {isEdit && (
            <CustomTextField
              select
              fullWidth
              label='Status'
              value={form.status}
              onChange={e => handleChange('status', e.target.value)}
            >
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </CustomTextField>
          )}

          {/* Notas */}
          <CustomTextField
            fullWidth
            multiline
            rows={3}
            label='Notas / observações'
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
          />

          {confirmDelete && (
            <Typography variant='body2' color='error'>
              Clique novamente no ícone de lixeira para confirmar o cancelamento da sessão.
            </Typography>
          )}
        </div>
      </Box>

      {/* Footer */}
      <Box className='plb-4 pli-6 border-bs flex gap-3'>
        <Button
          fullWidth
          variant='contained'
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.start_datetime}
        >
          {loading ? 'Salvando…' : isEdit ? 'Atualizar' : 'Criar sessão'}
        </Button>
        <Button fullWidth variant='outlined' color='secondary' onClick={onClose}>
          Cancelar
        </Button>
      </Box>
    </Drawer>
  )
}
