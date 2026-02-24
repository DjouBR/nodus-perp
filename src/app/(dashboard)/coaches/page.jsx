// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'

const coachesMock = [
  { id: 1, name: 'Fernanda Lima', specialty: 'HIIT, CrossFit', athletes: 28, academy: 'CrossFit Valinhos' },
  { id: 2, name: 'Bruno Alves', specialty: 'Hyrox, Endurance', athletes: 15, academy: 'Studio Hyrox SP' },
  { id: 3, name: 'Juliana Rocha', specialty: 'Força, Potencia', athletes: 21, academy: 'CrossFit Valinhos' }
]

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Coaches</Typography>
          <Typography variant='body2' color='textSecondary'>Instrutores e treinadores vinculados às academias</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-user-plus' />}>
          Novo Coach
        </Button>
      </div>

      <Card>
        <CardHeader title='Coaches Cadastrados' subheader={`Total: ${coachesMock.length}`} />
        <CardContent>
          <div className='flex flex-col gap-3'>
            {coachesMock.map(c => (
              <div key={c.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex items-center gap-3'>
                  <Avatar className='bg-secondary/20 text-secondary font-bold'>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <div>
                    <Typography variant='body1' className='font-semibold'>{c.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {c.specialty} • {c.athletes} atletas • {c.academy}
                    </Typography>
                  </div>
                </div>
                <Button size='small' variant='outlined'>Ver</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
