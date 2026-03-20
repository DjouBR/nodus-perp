'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'

import { useDashboard } from '@/hooks/useDashboard'
import StatCard        from '@views/dashboards/components/StatCard'
import ACWRCard        from '@views/dashboards/components/ACWRCard'
import NextSessionsCard from '@views/dashboards/components/NextSessionsCard'

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

  const progress = data?.progress

  return (
    <Grid container spacing={6}>
      {/* ── Linha 1: 4 StatCards ── */}
      {stats.map(s => (
        <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard {...s} loading={loading} />
        </Grid>
      ))}

      {/* ── Linha 2: Próximas Sessões + ACWR ── */}
      <Grid size={{ xs: 12, md: 8 }}>
        <NextSessionsCard />
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
