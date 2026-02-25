'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

const colorMap = {
  primary: { bg: 'var(--mui-palette-primary-lightOpacity)',  text: 'var(--mui-palette-primary-main)' },
  success: { bg: 'var(--mui-palette-success-lightOpacity)',  text: 'var(--mui-palette-success-main)' },
  error:   { bg: 'var(--mui-palette-error-lightOpacity)',    text: 'var(--mui-palette-error-main)'   },
  warning: { bg: 'var(--mui-palette-warning-lightOpacity)', text: 'var(--mui-palette-warning-main)' },
  info:    { bg: 'var(--mui-palette-info-lightOpacity)',     text: 'var(--mui-palette-info-main)'    },
}

const StatCard = ({ title, value, icon, color = 'primary', trend }) => {
  const c = colorMap[color] ?? colorMap.primary

  return (
    <Card className='h-full'>
      <CardContent className='flex items-center gap-4'>
        <Avatar sx={{ bgcolor: c.bg, width: 56, height: 56 }}>
          <i className={`${icon} text-2xl`} style={{ color: c.text }} />
        </Avatar>
        <div className='flex flex-col flex-1'>
          <Typography variant='body2' color='textSecondary'>{title}</Typography>
          <Typography variant='h4' className='font-bold' style={{ color: c.text }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant='caption' color='textSecondary'>{trend}</Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard
