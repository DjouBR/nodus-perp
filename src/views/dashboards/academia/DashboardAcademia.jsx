'use client'

import Grid from '@mui/material/Grid'

import StatCard           from '@views/dashboards/components/StatCard'
import AlertsCard         from '@views/dashboards/components/AlertsCard'
import SessionsTableCard  from '@views/dashboards/components/SessionsTableCard'
import TopAthletesCard    from '@views/dashboards/components/TopAthletesCard'
import HRZonesDonutCard   from '@views/dashboards/components/HRZonesDonutCard'
import WeeklyPresenceCard from '@views/dashboards/components/WeeklyPresenceCard'

// ── Dados simulados — substituir por fetch da API (Fase 5 real) ─────────────
const stats = [
  { title: 'Atletas Ativos',     value: '148',   icon: 'tabler-users',             color: 'primary', trend: '+12 este mês',  trendUp: true  },
  { title: 'Sessões Hoje',       value: '6',     icon: 'tabler-activity',           color: 'success', trend: '2 em andamento' },
  { title: 'FC Média Hoje',      value: '142',   icon: 'tabler-heart-rate-monitor', color: 'error',   trend: 'bpm — zona 3'  },
  { title: 'Calorias Queimadas', value: '18.4k', icon: 'tabler-flame',              color: 'warning', trend: 'hoje no total'  },
]

const alerts = [
  { athlete: 'Carlos Mendes',  message: 'FC acima de zona 5 há 3 min',    severity: 'error',   time: 'agora' },
  { athlete: 'Ana Paula',      message: 'ACWR = 1.6 — risco de lesão',    severity: 'warning', time: '5 min' },
  { athlete: 'Rodrigo Lima',   message: 'Ausente há 7 dias consecutivos', severity: 'info',    time: '1h'   },
]

const sessions = [
  { name: 'Spinning Manhã',   time: '07:00', coach: 'João Silva',  athletes: 18, status: 'encerrada' },
  { name: 'CrossFit Turma A', time: '09:00', coach: 'Maria Costa', athletes: 22, status: 'andamento' },
  { name: 'Funcional',        time: '11:00', coach: 'Pedro Alves', athletes: 15, status: 'andamento' },
  { name: 'Spinning Tarde',   time: '17:00', coach: 'João Silva',  athletes: 20, status: 'agendada'  },
  { name: 'CrossFit Turma B', time: '19:00', coach: 'Maria Costa', athletes: 25, status: 'agendada'  },
]

const topAthletes = [
  { name: 'Ana Paula',      avatar: 'AP', calories: 3840, sessions: 22, zone: 3 },
  { name: 'Carlos Mendes',  avatar: 'CM', calories: 3610, sessions: 20, zone: 4 },
  { name: 'Lucia Ferreira', avatar: 'LF', calories: 3450, sessions: 19, zone: 3 },
  { name: 'Bruno Souza',    avatar: 'BS', calories: 3200, sessions: 18, zone: 2 },
  { name: 'Patricia Nunes', avatar: 'PN', calories: 2980, sessions: 17, zone: 3 },
]

const hrZones = [
  { zone: 'Z1 Repouso',  pct: 8,  color: '#a8d8ea' },
  { zone: 'Z2 Aeróbico', pct: 27, color: '#4caf50' },
  { zone: 'Z3 Tempo',    pct: 35, color: '#ff9800' },
  { zone: 'Z4 Limiar',   pct: 22, color: '#f44336' },
  { zone: 'Z5 Máximo',   pct: 8,  color: '#9c27b0' },
]

const weeklyPresence = [
  { day: 'Seg', count: 42 },
  { day: 'Ter', count: 38 },
  { day: 'Qua', count: 51 },
  { day: 'Qui', count: 45 },
  { day: 'Sex', count: 60 },
  { day: 'Sáb', count: 35 },
  { day: 'Dom', count: 18 },
]

const DashboardAcademia = () => (
  <Grid container spacing={6}>
    {/* ── Linha 1: 4 StatCards ── */}
    {stats.map(s => (
      <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
        <StatCard {...s} />
      </Grid>
    ))}

    {/* ── Linha 2: Alertas (7) + Zonas de FC (5) ── */}
    <Grid size={{ xs: 12, md: 7 }}>
      <AlertsCard alerts={alerts} />
    </Grid>
    <Grid size={{ xs: 12, md: 5 }}>
      <HRZonesDonutCard zones={hrZones} />
    </Grid>

    {/* ── Linha 3: Sessões (7) + Top Atletas (5) ── */}
    <Grid size={{ xs: 12, lg: 7 }}>
      <SessionsTableCard sessions={sessions} />
    </Grid>
    <Grid size={{ xs: 12, lg: 5 }}>
      <TopAthletesCard athletes={topAthletes} />
    </Grid>

    {/* ── Linha 4: Presença semanal (full width) ── */}
    <Grid size={{ xs: 12 }}>
      <WeeklyPresenceCard data={weeklyPresence} />
    </Grid>
  </Grid>
)

export default DashboardAcademia
