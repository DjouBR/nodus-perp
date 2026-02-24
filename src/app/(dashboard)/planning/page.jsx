// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

const templates = [
  { name: 'HIIT 30:30', desc: '30s esforço / 30s recuperação • Z4-Z5', sets: 10, zone: 'Z4-Z5' },
  { name: 'Tabata', desc: '20s on / 10s off • 8 rounds • Z5', sets: 8, zone: 'Z5' },
  { name: 'Base Aeróbia', desc: 'Volume contínuo em Z2 • 45-60min', sets: 1, zone: 'Z2' },
  { name: 'Limiar LT2', desc: 'Blocos de 10-20min em Z3-Z4', sets: 3, zone: 'Z3-Z4' },
  { name: 'Regenerativo', desc: 'Baixa intensidade Z1 • Recuperação ativa', sets: 1, zone: 'Z1' }
]

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Planejamento</Typography>
          <Typography variant='body2' color='textSecondary'>Calendário de aulas, templates e periodização</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-plus' />}>
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardHeader title='Templates de Treino' subheader='Biblioteca de sessões pré-configuradas' />
        <CardContent>
          <div className='flex flex-col gap-3'>
            {templates.map(t => (
              <div key={t.name} className='flex items-center justify-between p-3 border rounded-lg'>
                <div>
                  <Typography variant='body1' className='font-semibold'>{t.name}</Typography>
                  <Typography variant='caption' color='textSecondary'>{t.desc}</Typography>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip label={t.zone} size='small' color='primary' variant='outlined' />
                  <Button size='small' variant='outlined'>Usar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
