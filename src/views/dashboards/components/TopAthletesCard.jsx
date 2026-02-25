'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Link from 'next/link'

const zoneColors = ['#a8d8ea','#4caf50','#ff9800','#f44336','#9c27b0']

const TopAthletesCard = ({ athletes = [] }) => {
  const maxCalories = Math.max(...athletes.map(a => a.calories), 1)

  return (
    <Card className='h-full'>
      <CardHeader
        title='Top Atletas do Mês'
        subheader='Por calorias queimadas'
        action={<Button size='small' component={Link} href='/athletes'>Ver todos</Button>}
        avatar={<i className='tabler-trophy text-warning text-2xl' />}
      />
      <CardContent className='pt-0'>
        <List disablePadding>
          {athletes.map((a, i) => (
            <ListItem key={i} className='px-0 flex flex-col items-start gap-1'>
              <div className='flex items-center gap-3 w-full'>
                <Avatar sx={{ width: 36, height: 36, bgcolor: zoneColors[a.zone - 1], fontSize: 13, fontWeight: 700 }}>
                  {a.avatar}
                </Avatar>
                <div className='flex-1'>
                  <div className='flex justify-between items-center'>
                    <Typography variant='body2' className='font-semibold'>{a.name}</Typography>
                    <Typography variant='caption' className='font-bold' color='textSecondary'>
                      {a.calories.toLocaleString('pt-BR')} kcal
                    </Typography>
                  </div>
                  <LinearProgress
                    variant='determinate'
                    value={(a.calories / maxCalories) * 100}
                    sx={{ height: 6, borderRadius: 3, mt: 0.5,
                      '& .MuiLinearProgress-bar': { bgcolor: zoneColors[a.zone - 1] } }}
                  />
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default TopAthletesCard
