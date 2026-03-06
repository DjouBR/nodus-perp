import AthleteDetailView from '@/views/athletes/AthleteDetailView'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Perfil do Aluno — NODUS' }

export default async function CoachAthleteDetailPage({ params }) {
  const { id } = await params
  if (!id) notFound()
  return <AthleteDetailView athleteId={id} backPath='/coach/athletes' />
}
