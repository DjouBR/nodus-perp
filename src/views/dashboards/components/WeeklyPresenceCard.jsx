'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const WeeklyPresenceCard = ({ data = [] }) => {
  return (
    <Card>
      <CardHeader
        title='Presença Semanal'
        subheader='Total de atletas por dia na semana'
        avatar={<i className='tabler-chart-bar text-primary text-2xl' />}
      />
      <CardContent className='pt-0'>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='day' axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'var(--mui-palette-action-hover)' }} />
            <Bar dataKey='count' name='Atletas' fill='var(--mui-palette-primary-main)'
              radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default WeeklyPresenceCard
