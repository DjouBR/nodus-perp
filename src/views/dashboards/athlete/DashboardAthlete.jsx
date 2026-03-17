'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Link from 'next/link'

import { useDashboard } from '@/hooks/useDashboard'

import StatCard from '@views/dashboards/components/StatCard'
import ACWRCard from '@views/dashboards/components/ACWRCard'

// ── Empty state: próxima sessão ──────────────────────────────────────
const EmptyNextSession = () => (
  <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
    <i className='tabler-calendar-off text-4xl text-secondary opacity-50' />
    <Typography variant='body1' className='font-semibold'>Nenhuma sessão agendada</Typography>
    <Typography variant='body2' color='textSecondary'>Seu próximo treino aparecerá aqui quando for agendado.</Typography>
  </div>
)

const DashboardAthlete = () => {
  const { data, loading, error } = useDashboard('athlete')

  if (error) return (
    <div className='flex items-center justify-center h-64'>
      <Typography color='error'>Erro ao carregar dashboard: {error}</Typography>
    </div>
  )

  const stats = [
    {
      title: 'Sessões no Mês',
      value: data ? String(data.stats.sessionsThisMonth) : '—',
      icon: 'tabler-activity',
      color: 'primary',
      trend: 'meta: 20 sessões',
      trendUp: data ? data.stats.sessionsThisMonth >= 20 : undefined,
    },
    {
      title: 'Calorias no Mês',
      value: data ? (data.stats.caloriesthisMonth > 0 ? `${(data.stats.caloriesthisMonth/1000).toFixed(1)}k` : '0') : '—',
      icon: 'tabler-flame',
      color: 'error',
      trend: 'kcal queimadas',
    },
    {
      title: 'Streak Atual',
      value: data ? String(data.stats.streak) : '—',
      icon: 'tabler-bolt',
      color: 'warning',
      trend: data ? (data.stats.streak > 0 ? `${data.stats.streak} dias seguidos` : 'treine hoje!') : undefined,
      trendUp: data ? data.stats.streak >= 3 : undefined,
    },
    {
      title: 'Ranking',
      value: data ? (data.stats.ranking ? `#${data.stats.ranking}` : '—') : '—',
      icon: 'tabler-trophy',
      color: 'success',
      trend: 'na academia',
    },
  ]

  const ns = data?.nextSession
  const progress = data?.progress

  return (
    <Grid container spacing={6}>
      {/* ── Linha 1: 4 StatCards ── */}
      {stats.map(s => (
        <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard {...s} loading={loading} />
        </Grid>
      ))}

      {/* ── Linha 2: Próxima Sessão + ACWR ── */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader
            title='Próxima Sessão'
            avatar={<i className='tabler-calendar text-primary text-2xl' />}
          />
          <CardContent>
            {loading ? (
              <>
                <Skeleton variant='text' width='60%' height={32} />
                <Skeleton variant='text' width='40%' />
                <Skeleton variant='rounded' height={36} className='mt-3' />
              </>
            ) : !ns ? (
              <EmptyNextSession />
            ) : (
              <div className='flex flex-col gap-4'>
                <div className='flex justify-between items-start'>
                  <div>
                    <Typography variant='h6' className='font-bold'>{ns.name}</Typography>
                    <Typography color='textSecondary' variant='body2'>
                      {new Date(ns.start_datetime).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })} às {ns.time} — Coach: {ns.coach}
                    </Typography>
                  </div>
                  <Chip
                    label={ns.status === 'active' ? 'Em andamento' : 'Agendada'}
                    color={ns.status === 'active' ? 'success' : 'primary'}
                    variant='tonal'
                  />
                </div>
                <div className='flex gap-2 flex-wrap'>
                  {ns.duration_min && <Chip icon={<i className='tabler-clock ml-2' />} label={`${ns.duration_min} min`} size='small' variant='tonal' />}
                  {ns.capacity     && <Chip icon={<i className='tabler-users ml-2' />} label={`${ns.capacity} atletas`} size='small' variant='tonal' />}
                </div>
                <Button variant='contained' component={Link} href='/sessions' fullWidth>
                  Ver Detalhes da Sessão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <ACWRCard acwr={data?.acwr ?? null} label='meu ACWR' loading={loading} />
      </Grid>

      {/* ── Linha 3: Meu Progresso ── */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Meu Progresso'
            avatar={<i className='tabler-chart-line text-success text-2xl' />}
          />
          <CardContent>
            <Grid container spacing={4}>
              {loading ? (
                [1,2,3].map(i => (
                  <Grid key={i} size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='rounded' height={48} />
                  </Grid>
                ))
              ) : [
                { label: 'Sessões no mês',  value: progress?.sessions?.value  ?? 0, max: progress?.sessions?.max  ?? 20,    color: 'primary' },
                { label: 'Meta de calorias', value: Math.round((progress?.calories?.value ?? 0) / (progress?.calories?.max ?? 20000) * 100), max: 100, color: 'error', suffix: '%' },
                { label: 'Consistência',     value: progress?.consistency?.value ?? 0, max: 100, color: 'success', suffix: '%' },
              ].map(p => (
                <Grid key={p.label} size={{ xs: 12, md: 4 }}>
                  <div className='flex flex-col gap-2'>
                    <div className='flex justify-between'>
                      <Typography variant='body2'>{p.label}</Typography>
                      <Typography variant='body2' className='font-semibold'>
                        {p.suffix ? `${p.value}${p.suffix}` : `${p.value}/${p.max}`}
                      </Typography>
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={Math.min(100, p.max > 0 ? (p.value / p.max) * 100 : 0)}
                      color={p.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </div>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DashboardAthlete
