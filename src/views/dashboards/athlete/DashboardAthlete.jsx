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
import ACWRCard from '@views/dashboards/components/ACWRCard'

// ── Dados simulados — substituir por fetch da API (Fase 5 real) ─────────────
const stats = [
  { title: 'Sessões no Mês',  value: '14',   icon: 'tabler-activity', color: 'primary', trend: 'meta: 20'         },
  { title: 'Calorias no Mês', value: '12.4k',icon: 'tabler-flame',    color: 'error',   trend: 'kcal queimadas'   },
  { title: 'Streak Atual',    value: '6',    icon: 'tabler-bolt',     color: 'warning', trend: 'dias seguidos'    },
  { title: 'Ranking',         value: '#4',   icon: 'tabler-trophy',   color: 'success', trend: 'na academia'      },
]

const DashboardAthlete = () => (
  <Grid container spacing={6}>
    {/* ── Linha 1: 4 StatCards ── */}
    {stats.map(s => (
      <Grid key={s.title} item xs={12} sm={6} xl={3}>
        <StatCard {...s} />
      </Grid>
    ))}

    {/* ── Linha 2: Próxima sessão (8) + ACWR (4) ── */}
    <Grid item xs={12} md={8}>
      <Card>
        <CardHeader
          title='Próxima Sessão'
          avatar={<i className='tabler-calendar text-primary text-2xl' />}
        />
        <CardContent>
          <div className='flex flex-col gap-4'>
            <div className='flex justify-between items-start'>
              <div>
                <Typography variant='h6' className='font-bold'>CrossFit Turma A</Typography>
                <Typography color='textSecondary' variant='body2'>Hoje às 19:00 — Coach: Maria Costa</Typography>
              </div>
              <Chip label='Agendada' color='primary' variant='tonal' />
            </div>
            <div className='flex gap-2 flex-wrap'>
              <Chip icon={<i className='tabler-target ml-2' />} label='Meta: Zona 3-4' size='small' variant='tonal' />
              <Chip icon={<i className='tabler-users ml-2' />}  label='25 atletas'    size='small' variant='tonal' />
              <Chip icon={<i className='tabler-clock ml-2' />}  label='60 min'        size='small' variant='tonal' />
            </div>
            <Button variant='contained' component={Link} href='/sessions' fullWidth>
              Ver Detalhes da Sessão
            </Button>
          </div>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={4}>
      <ACWRCard acwr={1.12} label='meu ACWR' />
    </Grid>

    {/* ── Linha 3: Meu Progresso (full width) ── */}
    <Grid item xs={12}>
      <Card>
        <CardHeader
          title='Meu Progresso'
          avatar={<i className='tabler-chart-line text-success text-2xl' />}
        />
        <CardContent>
          <Grid container spacing={4}>
            {[
              { label: 'Sessões no mês',  value: 14, max: 20,  color: 'primary' },
              { label: 'Meta de calorias',value: 62, max: 100, color: 'error'   },
              { label: 'Consistência',    value: 70, max: 100, color: 'success' },
            ].map(p => (
              <Grid key={p.label} item xs={12} md={4}>
                <div className='flex flex-col gap-2'>
                  <div className='flex justify-between'>
                    <Typography variant='body2'>{p.label}</Typography>
                    <Typography variant='body2' className='font-semibold'>{p.value}/{p.max}</Typography>
                  </div>
                  <LinearProgress
                    variant='determinate'
                    value={(p.value / p.max) * 100}
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

export default DashboardAthlete
