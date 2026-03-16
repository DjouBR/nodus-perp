'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CustomAvatar from '@core/components/mui/Avatar'

// colorMap → usa CSS vars do MUI palette
const colorMap = {
  primary: 'primary',
  success: 'success',
  error:   'error',
  warning: 'warning',
  info:    'info',
}

/**
 * StatCard — padrão template_novo
 *
 * Props:
 *   title   string  — legenda acima do valor
 *   value   string  — número/valor principal (grande)
 *   icon    string  — classe tabler (ex: 'tabler-users')
 *   color   string  — primary | success | error | warning | info
 *   trend   string  — texto do chip lateral (opcional)
 *   trendUp boolean — chip verde se true, vermelho se false, cinza se undefined
 */
const StatCard = ({ title, value, icon, color = 'primary', trend, trendUp }) => {
  const c = colorMap[color] ?? 'primary'

  const chipColor = trendUp === true ? 'success' : trendUp === false ? 'error' : 'default'

  return (
    <Card className='h-full'>
      <CardContent className='flex items-start justify-between gap-3 p-5'>
        {/* Ícone */}
        <CustomAvatar skin='light' color={c} variant='rounded' size={42}>
          <i className={`${icon} text-[22px]`} />
        </CustomAvatar>

        {/* Valor + título */}
        <div className='flex flex-col items-end flex-1'>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
            <Typography variant='h4' className='font-bold leading-tight'>
              {value}
            </Typography>
            {trend && (
              <Chip
                size='small'
                variant='tonal'
                color={chipColor}
                label={trend}
                className='text-xs font-medium'
              />
            )}
          </div>
          <Typography variant='body2' color='text.secondary' className='text-right'>
            {title}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard
