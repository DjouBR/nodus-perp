'use client'

import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import ReactApexcharts from '@/libs/ApexCharts'

const ApexChartWrapper = styled(Box)(({ theme }) => ({
  '& .apexcharts-canvas': {
    '& .apexcharts-tooltip': {
      boxShadow: 'var(--mui-customShadows-xs)',
      borderColor: 'var(--mui-palette-divider)',
      background: 'var(--mui-palette-background-paper)',
      '& .apexcharts-tooltip-title': {
        fontWeight: 600,
        borderColor: 'var(--mui-palette-divider)',
        background: 'var(--mui-palette-background-paper)'
      },
      '&.apexcharts-theme-light': { color: 'var(--mui-palette-text-primary)' },
      '&.apexcharts-theme-dark':  { color: 'var(--mui-palette-common-white)' },
    },
    '& .apexcharts-xaxistooltip': {
      borderColor: 'var(--mui-palette-divider)',
      background:  'var(--mui-palette-grey-50)',
    },
    '& .apexcharts-text, & .apexcharts-tooltip-text, & .apexcharts-legend-text': {
      fontFamily: `${theme.typography.fontFamily} !important`
    },
    '& .apexcharts-pie-label': { filter: 'none' },
    '& .apexcharts-marker':   { boxShadow: 'none' },
  }
}))

const AppReactApexCharts = ({ boxProps, ...rest }) => (
  <ApexChartWrapper {...boxProps}>
    <ReactApexcharts {...rest} />
  </ApexChartWrapper>
)

export default AppReactApexCharts
