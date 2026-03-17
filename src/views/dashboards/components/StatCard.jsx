'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import CustomAvatar from '@core/components/mui/Avatar'

/**
 * StatCard — card de métrica principal
 * Props:
 *   title    : string
 *   value    : string | number   (valor principal)
 *   icon     : string            (classe tabler)
 *   color    : 'primary'|'success'|'error'|'warning'|'info'
 *   trend    : string            (texto do chip)
 *   trendUp  : true → chip verde | false → chip vermelho | undefined → chip cinza
 *   loading  : boolean           (exibe skeleton)
 */
const StatCard = ({ title, value, icon, color = 'primary', trend, trendUp, loading = false }) => (
  <Card>
    <CardContent className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <Typography variant='body2' color='textSecondary'>{title}</Typography>
        <CustomAvatar skin='light' color={color} size={42} className='rounded-md'>
          <i className={`${icon} text-xl`} />
        </CustomAvatar>
      </div>

      {loading ? (
        <>
          <Skeleton variant='text' width={80} height={40} />
          <Skeleton variant='rounded' width={100} height={24} />
        </>
      ) : (
        <>
          <Typography variant='h4' className='font-bold'>
            {value ?? '—'}
          </Typography>
          {trend && (
            <Chip
              label={trend}
              size='small'
              variant='tonal'
              color={
                trendUp === true  ? 'success' :
                trendUp === false ? 'error'   : 'default'
              }
              className='w-fit'
            />
          )}
        </>
      )}
    </CardContent>
  </Card>
)

export default StatCard
