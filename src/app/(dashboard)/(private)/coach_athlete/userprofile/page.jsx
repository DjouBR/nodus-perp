import { redirect } from 'next/navigation'

// Redireciona para o perfil do próprio coach_athlete
export default function CoachAthleteUserProfilePage() {
  redirect('/coach_athlete/profile')
}
