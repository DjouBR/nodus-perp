'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'

// Status labels por role-aware: atleta vê 'Aberta', staff vê 'Confirmada'
// Este componente é exclusivo de atletas → sempre 'Aberta'
const STATUS_LABELS = {
  scheduled: { label: 'Aberta',       color: 'primary' },
  active:    { label: 'Em andamento', color: 'success' },
  finished:  { label: 'Finalizada',   color: 'default' },
  cancelled: { label: 'Cancelada',    color: 'error'   },
}

const ZONE_COLORS = { 1: '#64748b', 2: '#22c55e', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444' }

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
  })
}
function formatTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function canCheckIn(s) {
  if (s.status === 'cancelled' || s.status === 'finished') return false
  const now   = new Date()
  const start = new Date(s.start_datetime)
  const end   = new Date(s.end_datetime)
  const isToday  = start.toDateString() === now.toDateString()
  const isActive = now >= start && now < end
  return isToday || isActive
}

function SessionDetailDialog({ session: s, open, onClose, onCheckIn, checkInLoading }) {
  if (!s) return null
  const statusInfo = STATUS_LABELS[s.status] || STATUS_LABELS.scheduled
  const checkInOk  = canCheckIn(s)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box className='flex items-center justify-between'>
          <Box className='flex items-center gap-2'>
            {s.type_color && (
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.type_color, display: 'inline-block', flexShrink: 0 }} />
            )}
            <Typography variant='h6' component='span'>{s.name}</Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <i className='tabler-x text-xl' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <div className='flex flex-col gap-4'>
          <Box className='flex flex-wrap gap-2'>
            <Chip size='small' label={statusInfo.label} color={statusInfo.color} />
            {s.type_name && <Chip size='small' label={s.type_name} variant='outlined' />}
            {s.checked_in
              ? <Chip size='small' icon={<i className='tabler-circle-check text-sm ml-1' />} label='Check-in realizado' color='success' variant='tonal' />
              : null}
          </Box>
          <Divider />
          <div className='grid grid-cols-2 gap-3'>
            <InfoRow icon='tabler-calendar'  label='Data'       value={formatDate(s.start_datetime)} />
            <InfoRow icon='tabler-clock'     label='Horário'    value={`${formatTime(s.start_datetime)} → ${formatTime(s.end_datetime)}`} />
            <InfoRow icon='tabler-hourglass' label='Duração'    value={`${s.duration_min} min`} />
            <InfoRow icon='tabler-users'     label='Capacidade' value={`${s.capacity} atletas`} />
            {s.coach_name && <InfoRow icon='tabler-user' label='Coach' value={s.coach_name} />}
          </div>
          {(s.target_zone_min || s.target_zone_max) && (
            <>
              <Divider />
              <div>
                <Typography variant='caption' color='textSecondary' sx={{ mb: 1, display: 'block' }}>Zonas de FC alvo</Typography>
                <Box className='flex gap-2 items-center'>
                  {[s.target_zone_min, s.target_zone_max].filter(Boolean).map((z, i) => (
                    <Chip key={i} size='small' label={`Z${z}`}
                      sx={{ background: ZONE_COLORS[z], color: '#fff', fontWeight: 600 }} />
                  ))}
                  <Typography variant='caption' color='textSecondary'>
                    {s.target_zone_min === s.target_zone_max ? `Zona ${s.target_zone_min}` : `Zona ${s.target_zone_min} a Z${s.target_zone_max}`}
                  </Typography>
                </Box>
              </div>
            </>
          )}
          {s.notes && (
            <>
              <Divider />
              <div>
                <Typography variant='caption' color='textSecondary' sx={{ mb: 0.5, display: 'block' }}>Notas do coach</Typography>
                <Typography variant='body2'>{s.notes}</Typography>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant='outlined' onClick={onClose}>Fechar</Button>
        {checkInOk && (
          <Button
            variant='contained'
            color={s.checked_in ? 'error' : 'success'}
            onClick={() => onCheckIn(s)}
            disabled={checkInLoading}
            startIcon={
              checkInLoading
                ? <CircularProgress size={16} color='inherit' />
                : <i className={`tabler-${s.checked_in ? 'x' : 'circle-check'} text-sm`} />
            }
          >
            {s.checked_in ? 'Desfazer check-in' : 'Fazer check-in'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <Box className='flex items-start gap-2'>
      <i className={`${icon} text-lg text-primary mt-0.5`} />
      <div>
        <Typography variant='caption' color='textSecondary' display='block'>{label}</Typography>
        <Typography variant='body2' className='font-medium'>{value}</Typography>
      </div>
    </Box>
  )
}

function SessionCard({ session: s, onDetail, onCheckIn, checkingId }) {
  const statusInfo = STATUS_LABELS[s.status] || STATUS_LABELS.scheduled
  const checkInOk  = canCheckIn(s)
  const isLoading  = checkingId === s.id

  return (
    <Card
      variant='outlined'
      sx={{
        opacity: s.status === 'cancelled' ? 0.6 : 1,
        borderLeft: `4px solid ${s.type_color || '#6366f1'}`,
        transition: 'box-shadow .15s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ p: '14px 16px !important' }}>
        <Box className='flex items-center justify-between gap-2 flex-wrap'>

          {/* Lado esquerdo */}
          <Box className='flex items-center gap-3 min-w-0'>
            <Box
              className='flex flex-col items-center justify-center rounded-lg px-2 py-1 min-w-[48px]'
              sx={{ background: 'var(--mui-palette-action-hover)' }}
            >
              <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1 }}>
                {new Date(s.start_datetime).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </Typography>
              <Typography variant='h6' sx={{ lineHeight: 1.1, fontWeight: 700 }}>
                {new Date(s.start_datetime).getDate()}
              </Typography>
              <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1 }}>
                {new Date(s.start_datetime).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
              </Typography>
            </Box>
            <Box className='min-w-0'>
              <Box className='flex items-center gap-2'>
                <Typography variant='body1' className='font-semibold truncate'>{s.name}</Typography>
                {s.checked_in ? <i className='tabler-circle-check text-success text-base' title='Check-in realizado' /> : null}
              </Box>
              <Box className='flex flex-wrap items-center gap-1 mt-0.5'>
                <Typography variant='caption' color='textSecondary'>
                  <i className='tabler-clock text-xs mr-0.5' />
                  {formatTime(s.start_datetime)}
                  {s.duration_min ? ` • ${s.duration_min} min` : ''}
                </Typography>
                {s.coach_name && (
                  <Typography variant='caption' color='textSecondary'>
                    • <i className='tabler-user text-xs mr-0.5' />{s.coach_name}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Lado direito */}
          <Box className='flex items-center gap-2 flex-shrink-0 flex-wrap'>
            {s.type_name && (
              <Chip size='small' label={s.type_name} variant='tonal'
                sx={{ background: s.type_color ? `${s.type_color}22` : undefined, color: s.type_color }} />
            )}
            <Chip size='small' label={statusInfo.label} color={statusInfo.color} />
            {/* ── Check-in rápido direto na lista (Ponto 1C) ── */}
            {checkInOk && (
              <Button
                size='small'
                variant={s.checked_in ? 'outlined' : 'contained'}
                color={s.checked_in ? 'error' : 'success'}
                onClick={() => onCheckIn(s)}
                disabled={isLoading}
                startIcon={
                  isLoading
                    ? <CircularProgress size={14} color='inherit' />
                    : <i className={`tabler-${s.checked_in ? 'x' : 'circle-check'} text-sm`} />
                }
              >
                {s.checked_in ? 'Cancelar' : 'Check-in'}
              </Button>
            )}
            <Button
              size='small' variant='outlined'
              startIcon={<i className='tabler-eye text-sm' />}
              onClick={() => onDetail(s)}
            >
              Ver detalhes
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function SessionsAthleteView() {
  const [sessions,    setSessions]      = useState([])
  const [loading,     setLoading]       = useState(true)
  const [tab,         setTab]           = useState(0)
  const [detail,      setDetail]        = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkingId,  setCheckingId]    = useState(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch { setSessions([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleCheckIn = useCallback(async (s) => {
    setCheckingId(s.id)
    setCheckInLoading(true)
    try {
      const res  = await fetch(`/api/sessions/${s.id}/checkin`, { method: 'PUT' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer check-in')
      setSessions(prev => prev.map(item =>
        item.id === s.id ? { ...item, checked_in: data.checked_in } : item
      ))
      setDetail(prev => prev ? { ...prev, checked_in: data.checked_in } : prev)
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingId(null)
      setCheckInLoading(false)
    }
  }, [])

  const now      = new Date()
  const upcoming = sessions
    .filter(s => new Date(s.start_datetime) >= now && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
  const past = sessions
    .filter(s => new Date(s.start_datetime) < now || s.status === 'finished' || s.status === 'cancelled')
    .sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime))

  const listed = tab === 0 ? upcoming : past

  return (
    <Box className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <Typography variant='h5' className='font-bold'>Minhas Sessões</Typography>
          <Typography variant='body2' color='textSecondary'>
            {upcoming.length} sessão{upcoming.length !== 1 ? 'ões' : ''} disponível{upcoming.length !== 1 ? 'eis' : ''}
          </Typography>
        </div>
        <IconButton onClick={fetchSessions} title='Atualizar'>
          <i className='tabler-refresh text-xl' />
        </IconButton>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Disponíveis (${upcoming.length})`} />
        <Tab label={`Histórico (${past.length})`} />
      </Tabs>

      {loading ? (
        <div className='flex flex-col gap-3'>
          {[1, 2, 3].map(i => <Skeleton key={i} variant='rounded' height={72} />)}
        </div>
      ) : listed.length === 0 ? (
        <Box className='flex flex-col items-center justify-center py-16 gap-3'>
          <i className={`${tab === 0 ? 'tabler-calendar-off' : 'tabler-history'} text-5xl text-secondary opacity-40`} />
          <Typography variant='body1' color='textSecondary'>
            {tab === 0 ? 'Nenhuma sessão disponível' : 'Nenhuma sessão no histórico'}
          </Typography>
        </Box>
      ) : (
        <div className='flex flex-col gap-3'>
          {listed.map(s => (
            <SessionCard
              key={s.id}
              session={s}
              onDetail={setDetail}
              onCheckIn={handleCheckIn}
              checkingId={checkingId}
            />
          ))}
        </div>
      )}

      <SessionDetailDialog
        session={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onCheckIn={handleCheckIn}
        checkInLoading={checkInLoading}
      />
    </Box>
  )
}
