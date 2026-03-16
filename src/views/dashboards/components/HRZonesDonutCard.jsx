'use client'

import dynamic from 'next/dynamic'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import OptionMenu from '@core/components/option-menu'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

/**
 * HRZonesDonutCard
 * Props: zones = [{ zone, pct, color }]
 */
const HRZonesDonutCard = ({ zones = [] }) => {
  const theme = useTheme()

  const labels  = zones.map(z => z.zone)
  const series  = zones.map(z => z.pct)
  const colors  = zones.map(z => z.color)

  const options = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels,
    colors,
    legend: {
      position: 'bottom',
      fontSize: '13px',
      fontFamily: theme.typography.fontFamily,
      labels: { colors: 'var(--mui-palette-text-secondary)' },
      markers: { offsetX: -2 },
      itemMargin: { horizontal: 8 },
    },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: {
              fontSize: '1.5rem',
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily,
              color: 'var(--mui-palette-text-primary)',
              offsetY: -4,
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '0.75rem',
              fontFamily: theme.typography.fontFamily,
              color: 'var(--mui-palette-text-secondary)',
              formatter: () => '100%',
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: val => `${val}%` },
    },
  }

  return (
    <Card className='h-full'>
      <CardHeader
        title='Zonas de FC'
        subheader='Distribuição do grupo hoje'
        action={<OptionMenu options={['Esta Semana', 'Este Mês', 'Este Ano']} />}
      />
      <CardContent>
        {zones.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-6'>
            <i className='tabler-heart-off text-textDisabled text-5xl' />
            <Typography color='textSecondary'>Sem dados de FC hoje</Typography>
          </div>
        ) : (
          <AppReactApexCharts type='donut' height={300} width='100%' series={series} options={options} />
        )}
      </CardContent>
    </Card>
  )
}

export default HRZonesDonutCard
