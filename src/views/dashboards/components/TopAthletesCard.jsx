'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

/**
 * TopAthletesCard
 * Props: athletes = [{ name, avatar, calories, sessions, zone }]
 */
const TopAthletesCard = ({ athletes = [] }) => (
  <Card className='h-full'>
    <CardHeader
      title='Top Atletas'
      subheader='Por calorias no mês'
      action={<OptionMenu options={['Por Sessões', 'Por Calorias', 'Por Zona Média']} />}
    />
    <CardContent className='flex flex-col gap-5'>
      {athletes.map((a, i) => {
        const pct = Math.min(Math.round((a.calories / 4000) * 100), 100)
        return (
          <div key={i} className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='primary' variant='rounded' size={34}>
              <Typography variant='caption' className='font-bold'>{a.avatar}</Typography>
            </CustomAvatar>
            <div className='flex flex-col flex-1 gap-1'>
              <div className='flex items-center justify-between'>
                <Typography variant='body2' className='font-medium'>{a.name}</Typography>
                <Typography variant='caption' color='text.disabled'>{a.calories.toLocaleString('pt-BR')} kcal</Typography>
              </div>
              <LinearProgress
                value={pct}
                variant='determinate'
                color='primary'
                sx={{ height: 6, borderRadius: 3 }}
              />
            </div>
          </div>
        )
      })}
    </CardContent>
  </Card>
)

export default TopAthletesCard
