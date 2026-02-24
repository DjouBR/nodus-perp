// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

const academiesMock = [
  { id: 1, name: 'CrossFit Valinhos', cnpj: '12.345.678/0001-90', athletes: 64, plan: 'Pro', status: 'active' },
  { id: 2, name: 'Studio Hyrox SP', cnpj: '98.765.432/0001-10', athletes: 42, plan: 'Enterprise', status: 'active' },
  { id: 3, name: 'Academia Fit Plus', cnpj: '11.222.333/0001-44', athletes: 18, plan: 'Basic', status: 'trial' }
]

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Academias</Typography>
          <Typography variant='body2' color='textSecondary'>Gerencie as academias e equipes cadastradas</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-plus' />}>
          Nova Academia
        </Button>
      </div>

      <Card>
        <CardHeader title='Academias Cadastradas' subheader={`Total: ${academiesMock.length}`} />
        <CardContent>
          <div className='flex flex-col gap-3'>
            {academiesMock.map(ac => (
              <div key={ac.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex items-center gap-3'>
                  <i className='tabler-building-community text-primary text-2xl' />
                  <div>
                    <Typography variant='body1' className='font-semibold'>{ac.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>CNPJ: {ac.cnpj} • {ac.athletes} atletas</Typography>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip label={ac.plan} size='small' color='primary' variant='outlined' />
                  <Chip
                    label={ac.status === 'active' ? 'Ativo' : 'Trial'}
                    size='small'
                    color={ac.status === 'active' ? 'success' : 'warning'}
                  />
                  <Button size='small' variant='outlined'>Ver</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
