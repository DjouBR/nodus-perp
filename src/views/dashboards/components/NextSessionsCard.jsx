'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'

const STATUS_LABELS = {
  scheduled: { label: 'Aberta',       color: 'primary' },
  active:    { label: 'Em andamento', color: 'success' },
  finished:  { label: 'Finalizada',   color: 'default' },
  cancelled: { label: 'Cancelada',    color: 'error'   },
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
  return start.toDateString() === now.toDateString() || (now >= start && now < end)
}

function SessionRow({ session: s, onCheckIn, checkingId }) {
  const statusInfo  = STATUS_LABELS[s.status] || STATUS_LABELS.scheduled
  const checkInOk   = canCheckIn(s)
  const isLoading   = checkingId === s.id
  const date        = new Date(s.start_datetime)

  return (
    <Box className='flex items-center gap-3 py-2'>

      {/* Bloco de data */}
      <Box
        className='flex flex-col items-center justify-center rounded-lg px-2 py-1 min-w-[48px] flex-shrink-0'
        sx={{ background: 'var(--mui-palette-action-hover)' }}
      >
        <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1 }}>
          {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
        </Typography>
        <Typography variant='h6' sx={{ lineHeight: 1.1, fontWeight: 700 }}>
          {date.getDate()}
        </Typography>
        <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1 }}>
          {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
        </Typography>
      </Box>

      {/* Info */}
      <Box className='flex-1 min-w-0'>
        <Box className='flex items-center gap-1'>
          <Typography variant='body2' className='font-semibold truncate'>{s.name}</Typography>
          {s.checked_in ? (
            <i className='tabler-circle-check text-success text-sm flex-shrink-0' title='Check-in realizado' />
          ) : null}
        </Box>
        <Typography variant='caption' color='textSecondary'>
          {formatTime(s.start_datetime)}
          {s.duration_min ? ` • ${s.duration_min} min` : ''}
          {s.coach_name   ? ` • ${s.coach_name}`       : ''}
        </Typography>
      </Box>

      {/* Direita: tipo + status + check-in */}
      <Box className='flex items-center gap-1.5 flex-shrink-0'>
        {s.type_name && (
          <Chip
            size='small' label={s.type_name} variant='tonal'
            sx={{ background: s.type_color ? `${s.type_color}22` : undefined, color: s.type_color }}
          />
        )}
        <Chip size='small' label={statusInfo.label} color={statusInfo.color} variant='tonal' />
        {checkInOk && (
          <Button
            size='small'
            variant={s.checked_in ? 'outlined' : 'contained'}
            color={s.checked_in ? 'error' : 'success'}
            onClick={() => onCheckIn(s)}
            disabled={isLoading}
            sx={{ minWidth: 100, whiteSpace: 'nowrap' }}
            startIcon={
              isLoading
                ? <CircularProgress size={14} color='inherit' />
                : <i className={`tabler-${s.checked_in ? 'x' : 'circle-check'} text-sm`} />
            }
          >
            {s.checked_in ? 'Cancelar' : 'Check-in'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

/**
 * NextSessionsCard
 * Card reutilizável para o dashboard do atleta.
 * Mostra até 2 próximas sessões com check-in rápido.
 */
export default function NextSessionsCard() {
  const [sessions,    setSessions]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [checkingId,  setCheckingId]  = useState(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/dashboard/athlete/sessions')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch { setSessions([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleCheckIn = useCallback(async (s) => {
    setCheckingId(s.id)
    try {
      const res  = await fetch(`/api/sessions/${s.id}/checkin`, { method: 'PUT' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setSessions(prev => prev
        .map(item => item.id === s.id ? { ...item, checked_in: data.checked_in } : item)
        // Re-ordena: com check-in primeiro
        .sort((a, b) => (b.checked_in ?? 0) - (a.checked_in ?? 0))
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingId(null)
    }
  }, [])

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title='Próximas Sessões'
        avatar={<i className='tabler-calendar text-primary text-2xl' />}
      />
      <CardContent sx={{ flex: 1, pt: 0 }}>
        {loading ? (
          <div className='flex flex-col gap-3'>
            {[1, 2].map(i => <Skeleton key={i} variant='rounded' height={60} />)}
          </div>
        ) : sessions.length === 0 ? (
          <Box className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
            <i className='tabler-calendar-off text-4xl text-secondary opacity-50' />
            <Typography variant='body1' className='font-semibold'>Nenhuma sessão disponível</Typography>
            <Typography variant='body2' color='textSecondary'>
              Seu próximo treino aparecerá aqui quando for agendado.
            </Typography>
          </Box>
        ) : (
          <div>
            {sessions.map((s, i) => (
              <div key={s.id}>
                {i > 0 && <Divider sx={{ my: 0.5 }} />}
                <SessionRow session={s} onCheckIn={handleCheckIn} checkingId={checkingId} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {sessions.length > 0 && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            component={Link} href='/sessions'
            variant='outlined' fullWidth
            endIcon={<i className='tabler-arrow-right text-sm' />}
          >
            Ver mais sessões
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
