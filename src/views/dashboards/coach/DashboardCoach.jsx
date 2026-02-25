'use client'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import StatCard from '@views/dashboards/components/StatCard'
import AlertsCard from '@views/dashboards/components/AlertsCard'
import SessionsTableCard from '@views/dashboards/components/SessionsTableCard'

const stats = [
  { title: 'Atletas na Turma', value: '24',   icon: 'tabler-users',             color: 'primary', trend: '3 turmas ativas' },
  { title: 'Sessões Hoje',     value: '3',    icon: 'tabler-activity',           color: 'success', trend: '1 em andamento' },
  { title: 'FC Média Grupo',   value: '138',  icon: 'tabler-heart-rate-monitor', color: 'error',   trend: 'bpm — zona 3' },
  { title: 'ACWR Médio',       value: '1.12', icon: 'tabler-chart-line',         color: 'warning', trend: 'dentro do ideal' },
]

const alerts = [
  { athlete: 'Bruno Souza',  message: 'ACWR = 1.7 — reduzir carga',    severity: 'warning', time: 'hoje' },
  { athlete: 'Lucia Ferreira', message: 'Faltou 4 sessões seguidas',    severity: 'info',    time: '2 dias' },
]

const sessions = [
  { name: 'CrossFit Turma A', time: '09:00', coach: 'Você', athletes: 22, status: 'encerrada' },
  { name: 'Funcional',        time: '11:00', coach: 'Você', athletes: 15, status: 'andamento' },
  { name: 'CrossFit Turma B', time: '19:00', coach: 'Você', athletes: 25, status: 'agendada'  },
]

const DashboardCoach = () => (
  <div className='flex flex-col gap-6'>
    <div>
      <Typography variant='h4' className='font-bold'>Painel do Coach</Typography>
      <Typography color='textSecondary'>Suas turmas e atletas de hoje</Typography>
    </div>
    <Grid container spacing={4}>
      {stats.map(s => (
        <Grid item xs={12} sm={6} xl={3} key={s.title}><StatCard {...s} /></Grid>
      ))}
    </Grid>
    <Grid container spacing={4}>
      <Grid item xs={12} md={7}><SessionsTableCard sessions={sessions} /></Grid>
      <Grid item xs={12} md={5}><AlertsCard alerts={alerts} /></Grid>
    </Grid>
  </div>
)

export default DashboardCoach
