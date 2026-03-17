'use client'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { useDashboard } from '@/hooks/useDashboard'

import StatCard           from '@views/dashboards/components/StatCard'
import AlertsCard         from '@views/dashboards/components/AlertsCard'
import SessionsTableCard  from '@views/dashboards/components/SessionsTableCard'
import TopAthletesCard    from '@views/dashboards/components/TopAthletesCard'
import HRZonesDonutCard   from '@views/dashboards/components/HRZonesDonutCard'
import WeeklyPresenceCard from '@views/dashboards/components/WeeklyPresenceCard'

const DashboardAcademia = () => {
  const { data, loading, error } = useDashboard('academia')

  if (error) return (
    <div className='flex items-center justify-center h-64'>
      <Typography color='error'>Erro ao carregar dashboard: {error}</Typography>
    </div>
  )

  const stats = [
    {
      title: 'Atletas Ativos',
      value: data ? String(data.stats.activeAthletes) : '—',
      icon: 'tabler-users',
      color: 'primary',
      trend: data ? `+${data.stats.newThisMonth} este mês` : undefined,
      trendUp: data ? data.stats.newThisMonth > 0 : undefined,
    },
    {
      title: 'Sessões Hoje',
      value: data ? String(data.stats.sessionsToday) : '—',
      icon: 'tabler-activity',
      color: 'success',
      trend: data ? (data.stats.activeSessions > 0 ? `${data.stats.activeSessions} em andamento` : 'nenhuma ativa') : undefined,
    },
    {
      title: 'FC Média Hoje',
      value: data ? (data.stats.avgHrToday ? `${data.stats.avgHrToday}` : '—') : '—',
      icon: 'tabler-heart-rate-monitor',
      color: 'error',
      trend: data?.stats.avgHrToday ? 'bpm — média do dia' : 'sem dados de FC',
    },
    {
      title: 'Calorias Queimadas',
      value: data ? (data.stats.totalCaloriesToday > 0 ? `${(data.stats.totalCaloriesToday / 1000).toFixed(1)}k` : '0') : '—',
      icon: 'tabler-flame',
      color: 'warning',
      trend: 'hoje no total',
    },
  ]

  return (
    <Grid container spacing={6}>
      {/* ── Linha 1: 4 StatCards ── */}
      {stats.map(s => (
        <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard {...s} loading={loading} />
        </Grid>
      ))}

      {/* ── Linha 2: Alertas + HRZones ── */}
      <Grid size={{ xs: 12, md: 7 }}>
        <AlertsCard alerts={data?.alerts ?? []} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <HRZonesDonutCard zones={data?.hrZones ?? []} loading={loading} />
      </Grid>

      {/* ── Linha 3: Sessões + Top Atletas ── */}
      <Grid size={{ xs: 12, lg: 7 }}>
        <SessionsTableCard sessions={data?.sessionsToday ?? []} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <TopAthletesCard athletes={data?.topAthletes ?? []} loading={loading} />
      </Grid>

      {/* ── Linha 4: Presença semanal ── */}
      <Grid size={{ xs: 12 }}>
        <WeeklyPresenceCard data={data?.weeklyPresence ?? []} loading={loading} />
      </Grid>
    </Grid>
  )
}

export default DashboardAcademia
