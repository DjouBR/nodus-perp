'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import StatCard from '@views/dashboards/components/StatCard'
import WeeklyPresenceCard from '@views/dashboards/components/WeeklyPresenceCard'

const stats = [
  { title: 'Tenants Ativos',    value: '24',    icon: 'tabler-building-skyscraper', color: 'primary', trend: '+3 este mês' },
  { title: 'MRR',               value: 'R$18k', icon: 'tabler-currency-dollar',     color: 'success', trend: '+8% vs mês anterior' },
  { title: 'Sessões Globais',   value: '142',   icon: 'tabler-activity',            color: 'info',    trend: 'hoje em todos tenants' },
  { title: 'Sensores Online',   value: '318',   icon: 'tabler-bluetooth-connected', color: 'warning', trend: '12 com erro de sinal' },
]

const tenants = [
  { name: 'Academia FitLife', type: 'Academia',  athletes: 148, plan: 'Pro',        status: 'ativo'     },
  { name: 'Rede CrossFit+',   type: 'Franquia',  athletes: 410, plan: 'Enterprise', status: 'ativo'     },
  { name: 'Coach Marcos',     type: 'Treinador', athletes: 12,  plan: 'Basic',      status: 'ativo'     },
  { name: 'Gym Total',        type: 'Academia',  athletes: 89,  plan: 'Pro',        status: 'suspenso'  },
]

const weeklyData = [
  { day: 'Seg', count: 312 },
  { day: 'Ter', count: 298 },
  { day: 'Qua', count: 401 },
  { day: 'Qui', count: 380 },
  { day: 'Sex', count: 450 },
  { day: 'Sáb', count: 290 },
  { day: 'Dom', count: 120 },
]

const statusConfig = {
  ativo:     { label: 'Ativo',     color: 'success' },
  suspenso:  { label: 'Suspenso',  color: 'warning' },
  cancelado: { label: 'Cancelado', color: 'error'   },
}

const DashboardSuperAdmin = () => (
  <div className='flex flex-col gap-6'>
    <div>
      <Typography variant='h4' className='font-bold'>Painel Global NODUS</Typography>
      <Typography color='textSecondary'>Visão consolidada de todos os tenants</Typography>
    </div>
    <Grid container spacing={4}>
      {stats.map(s => (
        <Grid item xs={12} sm={6} xl={3} key={s.title}><StatCard {...s} /></Grid>
      ))}
    </Grid>
    <Grid container spacing={4}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader title='Tenants' avatar={<i className='tabler-building-skyscraper text-primary text-2xl' />} />
          <CardContent className='pt-0'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align='center'>Atletas</TableCell>
                  <TableCell>Plano</TableCell>
                  <TableCell align='center'>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map((t, i) => {
                  const cfg = statusConfig[t.status] ?? statusConfig.ativo
                  return (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant='body2' className='font-medium'>{t.name}</Typography></TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell align='center'>{t.athletes}</TableCell>
                      <TableCell><Chip label={t.plan} size='small' variant='outlined' /></TableCell>
                      <TableCell align='center'><Chip label={cfg.label} color={cfg.color} size='small' /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card className='h-full'>
          <CardHeader title='Saúde do Sistema' avatar={<i className='tabler-server text-success text-2xl' />} />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {[
                { label: 'Uptime',           value: '99.98%', color: 'success', icon: 'tabler-circle-check' },
                { label: 'Lat. WebSocket',   value: '18ms',   color: 'success', icon: 'tabler-wifi'         },
                { label: 'Sessões Ativas',  value: '14',     color: 'info',    icon: 'tabler-activity'     },
                { label: 'Erros (24h)',      value: '3',      color: 'warning', icon: 'tabler-alert-circle' },
              ].map(m => (
                <div key={m.label} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <i className={`${m.icon} text-lg`} style={{ color: `var(--mui-palette-${m.color}-main)` }} />
                    <Typography variant='body2'>{m.label}</Typography>
                  </div>
                  <Typography variant='body2' className='font-bold'
                    style={{ color: `var(--mui-palette-${m.color}-main)` }}>{m.value}</Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    <WeeklyPresenceCard data={weeklyData} />
  </div>
)

export default DashboardSuperAdmin
