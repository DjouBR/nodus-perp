// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

const athletesMock = [
  { id: 1, name: 'Lucas Oliveira', age: 28, sport: 'CrossFit', level: 'Elite', hrv: 72, readiness: 8, status: 'active' },
  { id: 2, name: 'Ana Costa', age: 24, sport: 'Hyrox', level: 'Avançado', hrv: 58, readiness: 6, status: 'active' },
  { id: 3, name: 'Rafael Mendes', age: 32, sport: 'HIIT', level: 'Intermediário', hrv: 45, readiness: 4, status: 'attention' },
  { id: 4, name: 'Carla Santos', age: 26, sport: 'Spinning', level: 'Iniciante', hrv: 61, readiness: 7, status: 'active' }
]

const readinessColor = r => r >= 7 ? 'success' : r >= 5 ? 'warning' : 'error'

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Atletas</Typography>
          <Typography variant='body2' color='textSecondary'>Cadastro, monitoramento e histórico dos atletas</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-user-plus' />}>
          Novo Atleta
        </Button>
      </div>

      <Card>
        <CardHeader title='Atletas Cadastrados' subheader={`Total: ${athletesMock.length}`} />
        <CardContent>
          <div className='flex flex-col gap-3'>
            {athletesMock.map(a => (
              <div key={a.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex items-center gap-3'>
                  <Avatar className='bg-primary/20 text-primary font-bold'>
                    {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <div>
                    <Typography variant='body1' className='font-semibold'>{a.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {a.age} anos • {a.sport} • {a.level}
                    </Typography>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip label={`HRV: ${a.hrv}ms`} size='small' color='info' variant='outlined' />
                  <Chip
                    label={`Readiness: ${a.readiness}/10`}
                    size='small'
                    color={readinessColor(a.readiness)}
                  />
                  <Button size='small' variant='outlined'>Perfil</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
