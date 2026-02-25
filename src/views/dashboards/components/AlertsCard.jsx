'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

const severityConfig = {
  error:   { color: 'error',   icon: 'tabler-alert-triangle',  label: 'Crítico'  },
  warning: { color: 'warning', icon: 'tabler-alert-circle',    label: 'Atenção'  },
  info:    { color: 'info',    icon: 'tabler-info-circle',     label: 'Info'     },
  success: { color: 'success', icon: 'tabler-circle-check',    label: 'OK'       },
}

const AlertsCard = ({ alerts = [] }) => {
  return (
    <Card className='h-full'>
      <CardHeader
        title='Alertas em Tempo Real'
        subheader={`${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} ativo${alerts.length !== 1 ? 's' : ''}`}
        avatar={<i className='tabler-bell-ringing text-error text-2xl' />}
      />
      <CardContent className='pt-0'>
        {alerts.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-6'>
            <i className='tabler-circle-check text-success text-5xl' />
            <Typography color='textSecondary'>Nenhum alerta ativo</Typography>
          </div>
        ) : (
          <List disablePadding>
            {alerts.map((alert, i) => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.info
              return (
                <ListItem key={i} divider={i < alerts.length - 1} className='px-0'>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `var(--mui-palette-${cfg.color}-lightOpacity)` }}>
                      <i className={`${cfg.icon} text-xl`}
                        style={{ color: `var(--mui-palette-${cfg.color}-main)` }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <div className='flex items-center gap-2'>
                        <Typography variant='body2' className='font-semibold'>{alert.athlete}</Typography>
                        <Chip label={cfg.label} color={cfg.color} size='small' />
                      </div>
                    }
                    secondary={alert.message}
                  />
                  <Typography variant='caption' color='textSecondary' className='whitespace-nowrap ml-2'>
                    {alert.time}
                  </Typography>
                </ListItem>
              )
            })}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsCard
