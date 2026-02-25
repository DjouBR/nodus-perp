// Server Component — redireciona para dashboard por role
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/libs/auth'

// Dashboard views por role
import DashboardAcademia from '@views/dashboards/academia/DashboardAcademia'
import DashboardCoach from '@views/dashboards/coach/DashboardCoach'
import DashboardAthlete from '@views/dashboards/athlete/DashboardAthlete'
import DashboardReception from '@views/dashboards/reception/DashboardReception'
import DashboardSuperAdmin from '@views/dashboards/superadmin/DashboardSuperAdmin'

export const metadata = {
  title: 'NODUS — Dashboard',
}

const HomePage = async () => {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  const role = session.user?.role

  if (role === 'super_admin')   return <DashboardSuperAdmin />
  if (role === 'tenant_admin')  return <DashboardAcademia />
  if (role === 'coach')         return <DashboardCoach />
  if (role === 'receptionist')  return <DashboardReception />
  if (role === 'athlete')       return <DashboardAthlete />

  // fallback
  return <DashboardAcademia />
}

export default HomePage
