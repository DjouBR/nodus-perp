'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

const zones = [
  { z: 'Z1', range: '50-60%', color: '#22c55e' },
  { z: 'Z2', range: '61-70%', color: '#84cc16' },
  { z: 'Z3', range: '71-80%', color: '#eab308' },
  { z: 'Z4', range: '81-90%', color: '#f97316' },
  { z: 'Z5', range: '91-100%', color: '#ef4444' }
]

const getZone = (hr, hrMax) => {
  const pct = hr / hrMax * 100
  if (pct <= 60) return 0
  if (pct <= 70) return 1
  if (pct <= 80) return 2
  if (pct <= 90) return 3
  return 4
}

const initialAthletes = [
  { id: 1, name: 'Lucas Oliveira', hrMax: 192, hr: 145, connected: true },
  { id: 2, name: 'Ana Costa', hrMax: 188, hr: 162, connected: true },
  { id: 3, name: 'Rafael Mendes', hrMax: 185, hr: 0, connected: false },
  { id: 4, name: 'Carla Santos', hrMax: 190, hr: 128, connected: true }
]

export default function Page() {
  const [athletes, setAthletes] = useState(initialAthletes)

  // Simulate real-time HR updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAthletes(prev => prev.map(a => {
        if (!a.connected) return a
        const delta = Math.floor(Math.random() * 11) - 5
        const newHr = Math.min(a.hrMax, Math.max(80, a.hr + delta))
        return { ...a, hr: newHr }
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Monitoramento Ao Vivo</Typography>
        <Typography variant='body2' color='textSecondary'>FC em tempo real • Atualiza a cada 2s</Typography>
      </div>

      <Grid container spacing={3}>
        {athletes.map(a => {
          const zoneIdx = a.connected ? getZone(a.hr, a.hrMax) : -1
          const zone = zoneIdx >= 0 ? zones[zoneIdx] : null
          const pct = a.connected ? Math.round(a.hr / a.hrMax * 100) : 0
          return (
            <Grid item xs={12} sm={6} md={3} key={a.id}>
              <Card
                style={{
                  borderTop: `4px solid ${zone ? zone.color : '#9ca3af'}`,
                  transition: 'border-color 0.5s'
                }}
              >
                <CardContent className='text-center'>
                  <div className='flex items-center justify-between mb-2'>
                    <Typography variant='body2' className='font-semibold'>{a.name}</Typography>
                    <Chip
                      label={a.connected ? 'Conectado' : 'Offline'}
                      size='small'
                      color={a.connected ? 'success' : 'default'}
                    />
                  </div>
                  <Typography
                    variant='h2'
                    className='font-bold my-2'
                    style={{ color: zone ? zone.color : '#9ca3af', transition: 'color 0.5s' }}
                  >
                    {a.connected ? a.hr : '--'}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>bpm</Typography>
                  {zone && (
                    <div className='mt-2'>
                      <Chip
                        label={`${zone.z} • ${pct}% FCMax`}
                        size='small'
                        style={{ backgroundColor: zone.color + '20', color: zone.color }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-3'>Legenda de Zonas</Typography>
          <div className='flex gap-3 flex-wrap'>
            {zones.map(z => (
              <Chip
                key={z.z}
                label={`${z.z}: ${z.range} FCMax`}
                style={{ backgroundColor: z.color + '20', color: z.color, borderColor: z.color }}
                variant='outlined'
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
