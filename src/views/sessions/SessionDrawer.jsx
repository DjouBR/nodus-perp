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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import CustomTextField from '@core/components/mui/TextField'

const STATUS_LABELS = {
  scheduled: { label: 'Agendada',     color: 'primary' },
  active:    { label: 'Em andamento', color: 'success' },
  finished:  { label: 'Finalizada',   color: 'default' },
  cancelled: { label: 'Cancelada',    color: 'error'   },
}

const WEEKDAYS = [
  { key: 'MON', label: 'Seg' },
  { key: 'TUE', label: 'Ter' },
  { key: 'WED', label: 'Qua' },
  { key: 'THU', label: 'Qui' },
  { key: 'FRI', label: 'Sex' },
  { key: 'SAT', label: 'Sáb' },
  { key: 'SUN', label: 'Dom' },
]

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

// Formata datetime do banco (UTC) para o input datetime-local (sem conversão de fuso)
function toLocalInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  // Extrai partes no horário LOCAL do usuário
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
  const isRecurring = !!session?.recurrence_group_id
  const isFinished  = session?.status === 'finished'

  const [form, setForm]               = useState(DEFAULT_VALUES)
  const [loading, setLoading]         = useState(false)

  // Recorrência
  const [recurring, setRecurring]         = useState(false)
  const [selectedDays, setSelectedDays]   = useState([])
  const [endDate, setEndDate]             = useState('')

  // Modal de confirmação de delete
  const [deleteDialog, setDeleteDialog] = useState(false)

  useEffect(() => {
    if (!open) return
    setRecurring(false)
    setSelectedDays([])
    setEndDate('')
    setDeleteDialog(false)

    if (isEdit) {
      setForm({
        id:              session.id,
        name:            session.name || '',
        session_type_id: session.session_type_id || '',
        start_datetime:  toLocalInput(session.start_datetime),
        duration_min:    session.duration_min || 60,
        capacity:        session.capacity || 30,
        target_zone_min: session.target_zone_min ?? 2,
        target_zone_max: session.target_zone_max ?? 4,
        notes:           session.notes || '',
        status:          session.status || 'scheduled',
      })
    } else {
      const baseDate = defaultDate ? `${defaultDate}T08:00` : toLocalInput(new Date())
      setForm({ ...DEFAULT_VALUES, start_datetime: baseDate })
    }
  }, [open, isEdit, session, defaultDate])

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleDay = key =>
    setSelectedDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key])

  const handleSubmit = async () => {
    if (!form.name || !form.start_datetime) return
    setLoading(true)
    const payload = { ...form }
    if (recurring && selectedDays.length > 0 && endDate) {
      payload.recurrence_rule     = selectedDays.join(',')
      payload.recurrence_end_date = endDate
    }
    await onSave(payload)
    setLoading(false)
  }

  // Abre modal ou deleta direto se não for recorrente
  const handleDeleteClick = () => {
    if (isFinished) return  // nunca deleta sessão finalizada
    setDeleteDialog(true)
  }

  const handleDeleteConfirm = async (scope) => {
    setDeleteDialog(false)
    setLoading(true)
    await onDelete(form.id, scope)
    setLoading(false)
  }

  const statusInfo = STATUS_LABELS[form.status] || STATUS_LABELS.scheduled

  return (
    <>
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
            {isEdit && <Chip size='small' label={statusInfo.label} color={statusInfo.color} />}
            {isRecurring && <Chip size='small' label='Recorrente' variant='outlined' />}
          </div>
          <Box className='flex items-center gap-1'>
            {isEdit && !isFinished && (
              <IconButton size='small' onClick={handleDeleteClick} title='Excluir sessão'>
                <i className='tabler-trash text-xl text-textPrimary' />
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

            <CustomTextField
              fullWidth required
              label='Nome da sessão'
              placeholder='ex: Aula de Spinning — Turma Manhã'
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
            />

            <CustomTextField
              select fullWidth
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

            <CustomTextField
              fullWidth required
              type='datetime-local'
              label='Data e hora de início'
              value={form.start_datetime}
              onChange={e => handleChange('start_datetime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <CustomTextField
              fullWidth type='number'
              label='Duração (minutos)'
              value={form.duration_min}
              onChange={e => handleChange('duration_min', Number(e.target.value))}
              inputProps={{ min: 5, step: 5 }}
            />

            <CustomTextField
              fullWidth type='number'
              label='Capacidade máxima (atletas)'
              value={form.capacity}
              onChange={e => handleChange('capacity', Number(e.target.value))}
              inputProps={{ min: 1 }}
            />

            <Divider />

            {/* Zonas alvo */}
            <Typography variant='subtitle2' color='textSecondary'>Zonas de FC alvo</Typography>
            <div className='flex gap-4'>
              <CustomTextField select fullWidth label='Zona mínima'
                value={form.target_zone_min}
                onChange={e => handleChange('target_zone_min', Number(e.target.value))}
              >
                {[1,2,3,4,5].map(z => <MenuItem key={z} value={z}>Z{z}</MenuItem>)}
              </CustomTextField>
              <CustomTextField select fullWidth label='Zona máxima'
                value={form.target_zone_max}
                onChange={e => handleChange('target_zone_max', Number(e.target.value))}
              >
                {[1,2,3,4,5].map(z => <MenuItem key={z} value={z}>Z{z}</MenuItem>)}
              </CustomTextField>
            </div>

            {isEdit && (
              <CustomTextField select fullWidth label='Status'
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </CustomTextField>
            )}

            {/* ── Recorrência (só na criação) ───────────────────────── */}
            {!isEdit && (
              <>
                <Divider />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={recurring}
                      onChange={e => { setRecurring(e.target.checked); setSelectedDays([]) }}
                    />
                  }
                  label='Sessão recorrente'
                />

                {recurring && (
                  <>
                    <Typography variant='caption' color='textSecondary'>
                      Selecione os dias da semana:
                    </Typography>
                    <FormGroup row>
                      {WEEKDAYS.map(({ key, label }) => (
                        <FormControlLabel
                          key={key}
                          label={label}
                          control={
                            <Checkbox
                              size='small'
                              checked={selectedDays.includes(key)}
                              onChange={() => toggleDay(key)}
                            />
                          }
                        />
                      ))}
                    </FormGroup>

                    <CustomTextField
                      fullWidth
                      type='date'
                      label='Repetir até'
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText='Última data em que a sessão deve ocorrer'
                    />
                  </>
                )}
              </>
            )}

            <Divider />

            <CustomTextField
              fullWidth multiline rows={3}
              label='Notas / observações'
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </div>
        </Box>

        {/* Footer */}
        <Box className='plb-4 pli-6 border-bs flex gap-3'>
          <Button
            fullWidth variant='contained'
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.start_datetime || (recurring && (selectedDays.length === 0 || !endDate))}
          >
            {loading ? 'Salvando…' : isEdit ? 'Atualizar' : recurring ? `Criar sessões recorrentes` : 'Criar sessão'}
          </Button>
          <Button fullWidth variant='outlined' color='secondary' onClick={onClose}>
            Cancelar
          </Button>
        </Box>
      </Drawer>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Excluir sessão</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            {isRecurring
              ? 'Esta é uma sessão recorrente. O que deseja excluir?'
              : 'Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          {isRecurring ? (
            <>
              <Button variant='outlined' color='error' onClick={() => handleDeleteConfirm('single')}>
                Só esta sessão
              </Button>
              <Button variant='contained' color='error' onClick={() => handleDeleteConfirm('future')}>
                Esta e as futuras
              </Button>
              <Button variant='outlined' onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button variant='contained' color='error' onClick={() => handleDeleteConfirm('single')}>
                Excluir
              </Button>
              <Button variant='outlined' onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
