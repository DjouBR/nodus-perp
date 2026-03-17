'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

// ── Empty state ──────────────────────────────────────────────────────
const EmptyAthletes = () => (
  <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
    <i className='tabler-trophy text-4xl text-warning opacity-50' />
    <Typography variant='body1' className='font-semibold'>Ainda sem ranking</Typography>
    <Typography variant='body2' color='textSecondary'>Os atletas aparecerão aqui após completarem sessões.</Typography>
  </div>
)

const AVATAR_COLORS = ['primary', 'success', 'error', 'warning', 'info']

const TopAthletesCard = ({ athletes = [], loading = false }) => {
  const maxCalories = athletes.length > 0 ? Math.max(...athletes.map(a => a.calories || 0)) : 1

  return (
    <Card className='h-full'>
      <CardHeader
        title='Top Atletas'
        avatar={<i className='tabler-trophy text-warning text-2xl' />}
        action={<OptionMenu options={['Esta semana', 'Este mês']} />}
      />
      <CardContent>
        {loading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} variant='rounded' height={40} className='mb-3' />)
        ) : athletes.length === 0 ? (
          <EmptyAthletes />
        ) : (
          <div className='flex flex-col gap-4'>
            {athletes.map((a, i) => (
              <div key={i} className='flex items-center gap-3'>
                <CustomAvatar skin='light' color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={36} className='rounded-full font-bold text-sm'>
                  {a.avatar || a.name?.slice(0,2).toUpperCase()}
                </CustomAvatar>
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between mb-1'>
                    <Typography variant='body2' className='font-semibold truncate'>{a.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>{a.calories?.toLocaleString('pt-BR') || 0} kcal</Typography>
                  </div>
                  <LinearProgress
                    variant='determinate'
                    value={maxCalories > 0 ? (a.calories / maxCalories) * 100 : 0}
                    color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TopAthletesCard
