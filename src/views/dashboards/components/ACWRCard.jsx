'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import dynamic from 'next/dynamic'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

// ── Empty state ──────────────────────────────────────────────────────
const EmptyACWR = ({ label }) => (
  <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
    <i className='tabler-chart-bar text-4xl text-secondary opacity-50' />
    <Typography variant='body1' className='font-semibold'>Aguardando sessões</Typography>
    <Typography variant='body2' color='textSecondary'>
      {label === 'meu ACWR'
        ? 'Seu ACWR aparecerá após a primeira semana de treino.'
        : 'O ACWR do grupo aparecerá após a primeira semana de treino.'}
    </Typography>
  </div>
)

const getZoneInfo = acwr => {
  if (acwr === null || acwr === undefined) return { color: '#9e9e9e', label: 'Sem dados', chip: 'default' }
  if (acwr < 0.8)  return { color: '#2196f3', label: 'Subcarga',      chip: 'info'    }
  if (acwr <= 1.3) return { color: '#4caf50', label: 'Zona Ideal',    chip: 'success' }
  if (acwr <= 1.5) return { color: '#ff9800', label: 'Atenção',       chip: 'warning' }
  return               { color: '#f44336', label: 'Risco de Lesão', chip: 'error'   }
}

const ACWRCard = ({ acwr, label = 'ACWR', loading = false }) => {
  const zone = getZoneInfo(acwr)
  const displayValue = acwr !== null && acwr !== undefined ? Number(acwr) : 0

  const chartOptions = {
    chart: { sparkline: { enabled: true } },
    stroke: { lineCap: 'round' },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '60%' },
        track: { background: 'var(--mui-palette-action-hover)' },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -4,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: zone.color,
            formatter: () => acwr !== null ? displayValue.toFixed(2) : '—',
          },
        },
      },
    },
    fill: { type: 'solid', colors: [zone.color] },
  }

  const pct = acwr !== null ? Math.min(100, Math.round((displayValue / 2) * 100)) : 0

  return (
    <Card className='h-full'>
      <CardHeader
        title='ACWR'
        subheader={label}
        avatar={<i className='tabler-chart-line text-primary text-2xl' />}
      />
      <CardContent className='flex flex-col items-center gap-4'>
        {loading ? (
          <Skeleton variant='circular' width={180} height={90} />
        ) : acwr === null || acwr === undefined ? (
          <EmptyACWR label={label} />
        ) : (
          <>
            <AppReactApexCharts
              type='radialBar'
              height={180}
              series={[pct]}
              options={chartOptions}
            />
            <Chip label={zone.label} color={zone.chip} variant='tonal' />
            <div className='w-full grid grid-cols-3 gap-2 text-center text-xs text-textSecondary'>
              <div><span className='font-semibold text-info'>{'< 0.8'}</span><br/>Subcarga</div>
              <div><span className='font-semibold text-success'>0.8–1.3</span><br/>Ideal</div>
              <div><span className='font-semibold text-error'>{'>1.5'}</span><br/>Risco</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ACWRCard
