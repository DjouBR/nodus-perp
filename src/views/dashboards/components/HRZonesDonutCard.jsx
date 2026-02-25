'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const HRZonesDonutCard = ({ zones = [] }) => {
  return (
    <Card className='h-full'>
      <CardHeader
        title='Zonas de FC Hoje'
        subheader='Distribuição do tempo em zona'
        avatar={<i className='tabler-heart-rate-monitor text-error text-2xl' />}
      />
      <CardContent className='pt-0'>
        <ResponsiveContainer width='100%' height={220}>
          <PieChart>
            <Pie
              data={zones}
              dataKey='pct'
              nameKey='zone'
              cx='50%'
              cy='50%'
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {zones.map((z, i) => (
                <Cell key={i} fill={z.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend
              iconType='circle'
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default HRZonesDonutCard
