// Server Component — renderiza visão por role
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import SessionsCalendarView from '@/views/sessions/SessionsCalendarView'
import SessionsAthleteView  from '@/views/sessions/SessionsAthleteView'

export const metadata = {
  title: 'Sessões de Treino | NODUS',
}

const ATHLETE_ROLES = ['athlete', 'academy_athlete', 'coach_athlete']

export default async function SessionsPage() {
  const session = await getServerSession(authOptions)
  const role    = session?.user?.role

  if (ATHLETE_ROLES.includes(role)) return <SessionsAthleteView />
  return <SessionsCalendarView />
}
