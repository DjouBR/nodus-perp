'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import OptionMenu from '@core/components/option-menu'

// ── Empty state ──────────────────────────────────────────────────────
const EmptyAlerts = () => (
  <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
    <i className='tabler-circle-check text-4xl text-success opacity-60' />
    <Typography variant='body1' className='font-semibold'>Tudo em ordem!</Typography>
    <Typography variant='body2' color='textSecondary'>Nenhum alerta de FC ou carga no momento.</Typography>
  </div>
)

const severityColor = { error: 'error', warning: 'warning', info: 'info', success: 'success' }
const severityLabel = { error: 'Crítico', warning: 'Atenção', info: 'Info', success: 'OK' }

const AlertsCard = ({ alerts = [], loading = false }) => (
  <Card className='h-full'>
    <CardHeader
      title='Alertas'
      avatar={<i className='tabler-bell text-warning text-2xl' />}
      action={<OptionMenu options={['Esta semana', 'Este mês', 'Últimos 3 meses']} />}
    />
    <CardContent>
      {loading ? (
        [1,2,3].map(i => <Skeleton key={i} variant='rounded' height={48} className='mb-2' />)
      ) : alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <List disablePadding>
          {alerts.map((a, i) => (
            <ListItem key={i} disablePadding className='mb-2 gap-3'>
              <Chip
                label={severityLabel[a.severity] || a.severity}
                color={severityColor[a.severity] || 'default'}
                size='small'
                variant='tonal'
                className='min-w-[64px]'
              />
              <ListItemText
                primary={<Typography variant='body2' className='font-semibold'>{a.athlete}</Typography>}
                secondary={<Typography variant='caption' color='textSecondary'>{a.message} · {a.time}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
)

export default AlertsCard
