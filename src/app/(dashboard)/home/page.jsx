// Server Component — redireciona para dashboard por role
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/libs/auth'

import DashboardAcademia    from '@views/dashboards/academia/DashboardAcademia'
import DashboardCoach       from '@views/dashboards/coach/DashboardCoach'
import DashboardAthlete     from '@views/dashboards/athlete/DashboardAthlete'
import DashboardReception   from '@views/dashboards/reception/DashboardReception'
import DashboardSuperAdmin  from '@views/dashboards/superadmin/DashboardSuperAdmin'

export const metadata = { title: 'NODUS — Dashboard' }

const HomePage = async () => {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user?.role

  if (role === 'super_admin')                              return <DashboardSuperAdmin />
  if (role === 'tenant_admin')                             return <DashboardAcademia />
  if (role === 'coach' || role === 'academy_coach')        return <DashboardCoach />
  if (role === 'receptionist')                             return <DashboardReception />
  if (['athlete', 'academy_athlete', 'coach_athlete'].includes(role)) return <DashboardAthlete />

  // fallback genérico
  return (
    <div className='flex items-center justify-center h-64'>
      <p className='text-textSecondary'>Role não reconhecido: <code>{role}</code></p>
    </div>
  )
}

export default HomePage
