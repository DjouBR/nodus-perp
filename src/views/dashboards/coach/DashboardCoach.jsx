'use client'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { useDashboard } from '@/hooks/useDashboard'

import StatCard          from '@views/dashboards/components/StatCard'
import AlertsCard        from '@views/dashboards/components/AlertsCard'
import SessionsTableCard from '@views/dashboards/components/SessionsTableCard'
import ACWRCard          from '@views/dashboards/components/ACWRCard'
import TopAthletesCard   from '@views/dashboards/components/TopAthletesCard'

const DashboardCoach = () => {
  const { data, loading, error } = useDashboard('coach')

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
      trend: '3 turmas',
    },
    {
      title: 'Sessões Hoje',
      value: data ? String(data.stats.sessionsToday) : '—',
      icon: 'tabler-activity',
      color: 'success',
      trend: data ? (data.stats.activeSessions > 0 ? `${data.stats.activeSessions} em andamento` : 'nenhuma ativa') : undefined,
    },
    {
      title: 'FC Média Grupo',
      value: data ? (data.stats.avgHrGroup ? `${data.stats.avgHrGroup}` : '—') : '—',
      icon: 'tabler-heart-rate-monitor',
      color: 'error',
      trend: data?.stats.avgHrGroup ? 'bpm — média do grupo' : 'sem dados de FC',
    },
    {
      title: 'ACWR Médio',
      value: data ? (data.stats.avgACWR ? String(data.stats.avgACWR) : '—') : '—',
      icon: 'tabler-chart-line',
      color: 'warning',
      trend: data?.stats.avgACWR
        ? (data.stats.avgACWR <= 1.3 ? 'zona ideal' : data.stats.avgACWR <= 1.5 ? 'atenção' : 'risco')
        : 'sem histórico',
      trendUp: data?.stats.avgACWR ? data.stats.avgACWR <= 1.3 : undefined,
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

      {/* ── Linha 2: Sessões + ACWR ── */}
      <Grid size={{ xs: 12, md: 8 }}>
        <SessionsTableCard sessions={data?.sessionsToday ?? []} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <ACWRCard acwr={data?.avgACWR ?? null} label='do grupo' loading={loading} />
      </Grid>

      {/* ── Linha 3: Alertas + Top Atletas ── */}
      <Grid size={{ xs: 12, md: 7 }}>
        <AlertsCard alerts={data?.alerts ?? []} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <TopAthletesCard athletes={data?.topAthletes ?? []} loading={loading} />
      </Grid>
    </Grid>
  )
}

export default DashboardCoach
