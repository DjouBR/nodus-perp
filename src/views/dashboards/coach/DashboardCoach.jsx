'use client'

import Grid from '@mui/material/Grid'

import StatCard          from '@views/dashboards/components/StatCard'
import AlertsCard        from '@views/dashboards/components/AlertsCard'
import SessionsTableCard from '@views/dashboards/components/SessionsTableCard'
import ACWRCard          from '@views/dashboards/components/ACWRCard'
import TopAthletesCard   from '@views/dashboards/components/TopAthletesCard'

// ── Dados simulados — substituir por fetch da API (Fase 5 real) ─────────────
const stats = [
  { title: 'Atletas Ativos',  value: '24',   icon: 'tabler-users',             color: 'primary', trend: '3 turmas'        },
  { title: 'Sessões Hoje',    value: '3',    icon: 'tabler-activity',           color: 'success', trend: '1 em andamento'  },
  { title: 'FC Média Grupo',  value: '138',  icon: 'tabler-heart-rate-monitor', color: 'error',   trend: 'bpm — zona 3'   },
  { title: 'ACWR Médio',      value: '1.12', icon: 'tabler-chart-line',         color: 'warning', trend: 'dentro do ideal' },
]

const alerts = [
  { athlete: 'Bruno Souza',    message: 'ACWR = 1.7 — reduzir carga',  severity: 'warning', time: 'hoje'   },
  { athlete: 'Lucia Ferreira', message: 'Faltou 4 sessões seguidas',   severity: 'info',    time: '2 dias' },
]

const sessions = [
  { name: 'CrossFit Turma A', time: '09:00', coach: 'Você', athletes: 22, status: 'encerrada' },
  { name: 'Funcional',        time: '11:00', coach: 'Você', athletes: 15, status: 'andamento' },
  { name: 'CrossFit Turma B', time: '19:00', coach: 'Você', athletes: 25, status: 'agendada'  },
]

const topAthletes = [
  { name: 'Bruno Souza',    avatar: 'BS', calories: 3200, sessions: 18, zone: 2 },
  { name: 'Lucia Ferreira', avatar: 'LF', calories: 3450, sessions: 19, zone: 3 },
  { name: 'Marcos Lima',    avatar: 'ML', calories: 2900, sessions: 15, zone: 3 },
]

const DashboardCoach = () => (
  <Grid container spacing={6}>
    {/* ── Linha 1: 4 StatCards ── */}
    {stats.map(s => (
      <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
        <StatCard {...s} />
      </Grid>
    ))}

    {/* ── Linha 2: Sessões (8) + ACWR radial (4) ── */}
    <Grid size={{ xs: 12, md: 8 }}>
      <SessionsTableCard sessions={sessions} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <ACWRCard acwr={1.12} label='do grupo' />
    </Grid>

    {/* ── Linha 3: Alertas (7) + Top Atletas (5) ── */}
    <Grid size={{ xs: 12, md: 7 }}>
      <AlertsCard alerts={alerts} />
    </Grid>
    <Grid size={{ xs: 12, md: 5 }}>
      <TopAthletesCard athletes={topAthletes} />
    </Grid>
  </Grid>
)

export default DashboardCoach
