import ClientDetailView from '@/views/admin/clients/ClientDetailView'

export const metadata = { title: 'Perfil do Cliente — NODUS Admin' }

export default async function AdminClientDetailPage({ params }) {
  const { id } = await params
  return <ClientDetailView clientId={id} />
}
