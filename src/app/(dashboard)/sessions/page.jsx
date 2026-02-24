// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'

const sessionsMock = [
  {
    id: 1,
    athlete: 'Lucas Oliveira',
    type: 'CrossFit',
    date: '24/02/2026',
    duration: 60,
    hrAvg: 148,
    hrMax: 178,
    trimp: 312,
    rpe: 7,
    zones: { z1: 5, z2: 12, z3: 20, z4: 18, z5: 5 }
  },
  {
    id: 2,
    athlete: 'Ana Costa',
    type: 'Hyrox',
    date: '24/02/2026',
    duration: 75,
    hrAvg: 162,
    hrMax: 185,
    trimp: 445,
    rpe: 9,
    zones: { z1: 2, z2: 8, z3: 15, z4: 30, z5: 20 }
  }
]

const typeColor = t => ({
  CrossFit: 'error', Hyrox: 'warning', HIIT: 'info', Força: 'success'
}[t] || 'default')

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Sessões de Treino</Typography>
          <Typography variant='body2' color='textSecondary'>Carga interna/externa, FC e TRIMP por sessão</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-plus' />}>
          Nova Sessão
        </Button>
      </div>

      <div className='flex flex-col gap-4'>
        {sessionsMock.map(s => (
          <Card key={s.id}>
            <CardHeader
              title={
                <div className='flex items-center gap-2'>
                  <span>{s.athlete}</span>
                  <Chip label={s.type} size='small' color={typeColor(s.type)} />
                </div>
              }
              subheader={`${s.date} • ${s.duration} min • RPE: ${s.rpe}/10`}
              action={<Button size='small' variant='outlined'>Detalhes</Button>}
            />
            <CardContent>
              <div className='flex gap-6 mb-4'>
                <div>
                  <Typography variant='caption' color='textSecondary'>FC Média</Typography>
                  <Typography variant='h6' className='font-bold'>{s.hrAvg} <span className='text-sm font-normal'>bpm</span></Typography>
                </div>
                <div>
                  <Typography variant='caption' color='textSecondary'>FC Máx</Typography>
                  <Typography variant='h6' className='font-bold'>{s.hrMax} <span className='text-sm font-normal'>bpm</span></Typography>
                </div>
                <div>
                  <Typography variant='caption' color='textSecondary'>TRIMP</Typography>
                  <Typography variant='h6' className='font-bold'>{s.trimp} <span className='text-sm font-normal'>UA</span></Typography>
                </div>
              </div>
              <div>
                <Typography variant='caption' color='textSecondary' className='mb-2 block'>Distribuição por Zonas</Typography>
                <div className='flex gap-1'>
                  {['Z1','Z2','Z3','Z4','Z5'].map((z, i) => {
                    const val = Object.values(s.zones)[i]
                    const total = Object.values(s.zones).reduce((a,b) => a+b, 0)
                    const pct = Math.round(val / total * 100)
                    const colors = ['#22c55e','#84cc16','#eab308','#f97316','#ef4444']
                    return (
                      <div key={z} className='flex-1 text-center'>
                        <Typography variant='caption'>{z}</Typography>
                        <div className='h-2 rounded mt-1' style={{ backgroundColor: colors[i], opacity: 0.3 + pct/100 }}>
                          <div className='h-full rounded' style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                        </div>
                        <Typography variant='caption'>{val}min</Typography>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
