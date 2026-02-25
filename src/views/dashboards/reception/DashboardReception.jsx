'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import ListItemAvatar from '@mui/material/ListItemAvatar'

import StatCard from '@views/dashboards/components/StatCard'

const stats = [
  { title: 'Check-ins Hoje',     value: '87',  icon: 'tabler-scan',         color: 'primary', trend: '+12 vs ontem' },
  { title: 'Pagamentos Hoje',    value: '14',  icon: 'tabler-cash',         color: 'success', trend: 'R$ 2.100 recebidos' },
  { title: 'Inadimplentes',      value: '8',   icon: 'tabler-alert-circle', color: 'error',   trend: 'avisar hoje' },
  { title: 'Anivers. da Semana', value: '3',   icon: 'tabler-cake',         color: 'warning', trend: 'enviar parabéns' },
]

const inadimplentes = [
  { name: 'Fábio Carvalho',  plan: 'Mensal',   days: 5  },
  { name: 'Renata Oliveira', plan: 'Trimestral', days: 12 },
  { name: 'Diego Santos',    plan: 'Mensal',   days: 3  },
]

const aniversariantes = [
  { name: 'Ana Paula',   date: 'Hoje',     avatar: 'AP' },
  { name: 'João Marcos', date: 'Amanhã',   avatar: 'JM' },
  { name: 'Carla Lima',  date: 'Sex-feira', avatar: 'CL' },
]

const DashboardReception = () => (
  <div className='flex flex-col gap-6'>
    <div>
      <Typography variant='h4' className='font-bold'>Recepção</Typography>
      <Typography color='textSecondary'>Painel operacional do dia</Typography>
    </div>
    <Grid container spacing={4}>
      {stats.map(s => (
        <Grid item xs={12} sm={6} xl={3} key={s.title}><StatCard {...s} /></Grid>
      ))}
    </Grid>
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Inadimplentes' avatar={<i className='tabler-alert-circle text-error text-2xl' />} />
          <CardContent className='pt-0'>
            <List disablePadding>
              {inadimplentes.map((a, i) => (
                <ListItem key={i} divider={i < inadimplentes.length - 1} className='px-0'>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'var(--mui-palette-error-lightOpacity)', color: 'var(--mui-palette-error-main)', fontWeight: 700 }}>
                      {a.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={a.name} secondary={a.plan} />
                  <Chip label={`${a.days} dias`} color='error' size='small' />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Anivers. da Semana' avatar={<i className='tabler-cake text-warning text-2xl' />} />
          <CardContent className='pt-0'>
            <List disablePadding>
              {aniversariantes.map((a, i) => (
                <ListItem key={i} divider={i < aniversariantes.length - 1} className='px-0'>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'var(--mui-palette-warning-lightOpacity)', color: 'var(--mui-palette-warning-main)', fontWeight: 700 }}>
                      {a.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={a.name} secondary={a.date} />
                  <Chip label='🎂 Parabéns!' color='warning' size='small' />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </div>
)

export default DashboardReception
