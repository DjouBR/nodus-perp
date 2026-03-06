import CoachDetailView from '@/views/coaches/CoachDetailView'

export const metadata = { title: 'Perfil do Coach — NODUS' }

export default async function CoachDetailPage({ params }) {
  const { id } = await params
  return <CoachDetailView coachId={id} backPath='/coaches' backLabel='Coaches' />
}
