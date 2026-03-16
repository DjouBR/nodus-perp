'use client'

import dynamic from 'next/dynamic'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'
import OptionMenu from '@core/components/option-menu'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

/**
 * WeeklyPresenceCard
 * Props: data = [{ day: 'Seg', count: 42 }, ...]
 */
const WeeklyPresenceCard = ({ data = [] }) => {
  const theme = useTheme()

  const series  = [{ name: 'Atletas', data: data.map(d => d.count) }]
  const categories = data.map(d => d.day)

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '38%',
        distributed: false,
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      padding: { top: -10, left: -2, right: 4, bottom: 0 },
    },
    colors: ['var(--mui-palette-primary-main)'],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks:  { show: false },
      labels: {
        style: {
          fontSize: '13px',
          fontFamily: theme.typography.fontFamily,
          colors: 'var(--mui-palette-text-disabled)',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '13px',
          fontFamily: theme.typography.fontFamily,
          colors: 'var(--mui-palette-text-disabled)',
        },
      },
    },
    tooltip: {
      y: { formatter: val => `${val} atletas` },
    },
  }

  return (
    <Card>
      <CardHeader
        title='Presença Semanal'
        subheader='Atletas por dia da semana'
        action={<OptionMenu options={['Esta Semana', 'Semana Passada', 'Últimas 4 Semanas']} />}
      />
      <CardContent>
        <AppReactApexCharts type='bar' height={220} width='100%' series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default WeeklyPresenceCard
