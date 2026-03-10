'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const fmt     = (v, u = '') => v ? `${v}${u}` : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

export default function CoachAthleteProfilePage() {
  const { data: session } = useSession()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/athletes/${session.user.id}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return (
    <div className='flex h-64 items-center justify-center'>
      <i className='tabler-loader-2 animate-spin text-4xl text-primary' />
    </div>
  )

  if (!data || data.error) return (
    <div className='flex h-64 flex-col items-center justify-center gap-2 text-textSecondary'>
      <i className='tabler-user-off text-5xl' />
      <p>Perfil não encontrado</p>
    </div>
  )

  const p = data.profile ?? {}

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold'>Meu Perfil</h1>
        <p className='text-sm text-textSecondary'>Seus dados cadastrais</p>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <div className='rounded-xl p-5 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
          <h3 className='mb-4 flex items-center gap-2 font-semibold'>
            <i className='tabler-id-badge text-primary' />Dados Pessoais
          </h3>
          {[['Nome', data.name],['Email', data.email],['Telefone', fmt(data.phone)],
            ['Nascimento', fmtDate(data.birthdate)],['Documento', fmt(data.document)]]
            .map(([label, value]) => (
              <div key={label} className='flex justify-between border-b py-2 text-sm'
                style={{ borderColor: 'var(--mui-palette-divider)' }}>
                <span className='text-textSecondary'>{label}</span>
                <span className='font-medium'>{value}</span>
              </div>
            ))}
        </div>

        <div className='rounded-xl p-5 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
          <h3 className='mb-4 flex items-center gap-2 font-semibold'>
            <i className='tabler-heartbeat text-error' />Ficha Esportiva
          </h3>
          {[['FC Máxima', fmt(p.hr_max, ' bpm')],['FC Repouso', fmt(p.hr_rest, ' bpm')],
            ['Peso', fmt(p.weight_kg, ' kg')],['Altura', fmt(p.height_cm, ' cm')],
            ['% Gordura', fmt(p.body_fat_pct, '%')],['Objetivo', fmt(p.goal)]]
            .map(([label, value]) => (
              <div key={label} className='flex justify-between border-b py-2 text-sm'
                style={{ borderColor: 'var(--mui-palette-divider)' }}>
                <span className='text-textSecondary'>{label}</span>
                <span className='font-medium'>{value}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
