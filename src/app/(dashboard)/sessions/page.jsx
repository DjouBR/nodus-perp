import Typography from '@mui/material/Typography'
import SessionsCalendarView from '@/views/sessions/SessionsCalendarView'

export const metadata = {
  title: 'Sessões de Treino | NODUS',
}

export default function SessionsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Sessões de Treino</Typography>
        <Typography variant='body2' color='textSecondary'>
          Planejamento e histórico de aulas — clique num dia para criar, clique num evento para editar.
        </Typography>
      </div>
      <SessionsCalendarView />
    </div>
  )
}
