import { AthleteDetailView } from '@/views/athletes/AthleteDetailView'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Perfil do Aluno — NODUS' }

export default function CoachAthleteDetailPage({ params }) {
  if (!params?.id) notFound()
  return <AthleteDetailView athleteId={params.id} backPath='/coach/athletes' />
}
