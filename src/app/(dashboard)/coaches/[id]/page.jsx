import CoachDetailView from '@/views/coaches/CoachDetailView'

export const metadata = { title: 'Perfil do Coach — NODUS' }

export default function CoachDetailPage({ params }) {
  return <CoachDetailView params={params} />
}
