'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Link from 'next/link'

import StatCard from '@views/dashboards/components/StatCard'

const stats = [
  { title: 'Sessões no Mês',  value: '14',   icon: 'tabler-activity',           color: 'primary', trend: 'meta: 20' },
  { title: 'Calorias no Mês', value: '12.4k', icon: 'tabler-flame',             color: 'error',   trend: 'kcal queimadas' },
  { title: 'Streak Atual',     value: '6',    icon: 'tabler-flame',             color: 'warning', trend: 'dias seguidos' },
  { title: 'Ranking',          value: '#4',   icon: 'tabler-trophy',            color: 'success', trend: 'na academia' },
]

const DashboardAthlete = () => (
  <div className='flex flex-col gap-6'>
    <div>
      <Typography variant='h4' className='font-bold'>Olá, Atleta! 👋</Typography>
      <Typography color='textSecondary'>Veja seu progresso e próximos treinos</Typography>
    </div>
    <Grid container spacing={4}>
      {stats.map(s => (
        <Grid item xs={12} sm={6} xl={3} key={s.title}><StatCard {...s} /></Grid>
      ))}
    </Grid>
    <Grid container spacing={4}>
      {/* Próxima sessão */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Próxima Sessão' avatar={<i className='tabler-calendar text-primary text-2xl' />} />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between items-center'>
                <div>
                  <Typography variant='h6' className='font-bold'>CrossFit Turma A</Typography>
                  <Typography color='textSecondary' variant='body2'>Hoje às 19:00 — Coach: Maria Costa</Typography>
                </div>
                <Chip label='Agendada' color='primary' />
              </div>
              <div className='flex gap-2 flex-wrap'>
                <Chip icon={<i className='tabler-target ml-2' />} label='Meta: Zona 3-4' size='small' />
                <Chip icon={<i className='tabler-users ml-2' />}  label='25 atletas'    size='small' />
                <Chip icon={<i className='tabler-clock ml-2' />}  label='60 min'        size='small' />
              </div>
              <Button variant='contained' component={Link} href='/sessions' fullWidth>
                Ver Detalhes da Sessão
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Meu progresso */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Meu Progresso' avatar={<i className='tabler-chart-line text-success text-2xl' />} />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {[
                { label: 'Sessões no mês',   value: 14, max: 20, color: 'primary' },
                { label: 'Meta de calorias',   value: 62, max: 100, color: 'error'   },
                { label: 'Consistência',       value: 70, max: 100, color: 'success' },
              ].map(p => (
                <div key={p.label}>
                  <div className='flex justify-between mb-1'>
                    <Typography variant='body2'>{p.label}</Typography>
                    <Typography variant='body2' className='font-semibold'>{p.value}/{p.max}</Typography>
                  </div>
                  <LinearProgress variant='determinate' value={(p.value/p.max)*100}
                    color={p.color} sx={{ height: 8, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </div>
)

export default DashboardAthlete
