import AthleteDetailView from '@/views/athletes/AthleteDetailView'

export const metadata = { title: 'Perfil do Atleta — NODUS' }

export default function AthleteDetailPage({ params }) {
  return <AthleteDetailView params={params} />
}
