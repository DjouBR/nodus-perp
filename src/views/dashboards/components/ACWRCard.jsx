'use client'

import dynamic from 'next/dynamic'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import CustomAvatar from '@core/components/mui/Avatar'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

const ACWR_ITEMS = [
  { label: 'Zona Segura',    range: '0.8 – 1.3', color: 'success', icon: 'tabler-circle-check' },
  { label: 'Zona de Risco',  range: '1.3 – 1.5', color: 'warning', icon: 'tabler-alert-circle'  },
  { label: 'Zona Perigosa',  range: '> 1.5',     color: 'error',   icon: 'tabler-alert-triangle' },
]

/**
 * ACWRCard — gráfico radialBar mostrando o ACWR médio do grupo/atleta
 * Props:
 *   acwr   number  — valor numérico ex: 1.12
 *   label  string  — "do grupo" | "seu ACWR" etc.
 */
const ACWRCard = ({ acwr = 0, label = 'do grupo' }) => {
  const theme = useTheme()

  // Normaliza para 0–200 (1.0 = 50%, 2.0 = 100% do radial)
  const pct = Math.min(Math.round((acwr / 2) * 100), 100)

  const color =
    acwr <= 1.3 ? 'var(--mui-palette-success-main)'
    : acwr <= 1.5 ? 'var(--mui-palette-warning-main)'
    : 'var(--mui-palette-error-main)'

  const options = {
    chart: { type: 'radialBar', toolbar: { show: false } },
    colors: [color],
    plotOptions: {
      radialBar: {
        startAngle: -140,
        endAngle: 130,
        hollow: { size: '60%' },
        track: { background: 'transparent' },
        dataLabels: {
          name: {
            offsetY: -22,
            color: 'var(--mui-palette-text-disabled)',
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.body2.fontSize,
          },
          value: {
            offsetY: 6,
            fontWeight: 600,
            formatter: () => String(acwr),
            color: 'var(--mui-palette-text-primary)',
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.h3.fontSize,
          },
        },
      },
    },
    labels: [label],
    grid: { padding: { top: -14, bottom: 10 } },
    stroke: { dashArray: 10 },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark', opacityTo: 0.5, opacityFrom: 1,
        shadeIntensity: 0.5, stops: [30, 70, 100],
        inverseColors: false, gradientToColors: [color],
      },
    },
  }

  return (
    <Card className='h-full'>
      <CardHeader title='ACWR' subheader='Acute:Chronic Workload Ratio' />
      <CardContent className='flex flex-col gap-4'>
        <AppReactApexCharts type='radialBar' height={220} width='100%' series={[pct]} options={options} />
        <div className='flex flex-col gap-3'>
          {ACWR_ITEMS.map(item => (
            <div key={item.label} className='flex items-center gap-3'>
              <CustomAvatar skin='light' color={item.color} variant='rounded' size={32}>
                <i className={`${item.icon} text-base`} />
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='body2' className='font-medium'>{item.label}</Typography>
                <Typography variant='caption' color='text.disabled'>{item.range}</Typography>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ACWRCard
