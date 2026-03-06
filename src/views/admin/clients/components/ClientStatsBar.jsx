'use client'

const ROLE_LABELS = {
  tenant_admin: 'Academias / Franquias',
  coach:        'Treinadores Independentes',
  athlete:      'Atletas Independentes',
}

export default function ClientStatsBar({ total, clients }) {
  const academies = clients.filter(c => c.role === 'tenant_admin').length
  const coaches   = clients.filter(c => c.role === 'coach').length
  const athletes  = clients.filter(c => c.role === 'athlete').length
  const actives   = clients.filter(c => c.is_active).length

  const stats = [
    { icon: 'tabler-users',             label: 'Total de Clientes',           value: total,    color: 'text-primary'  },
    { icon: 'tabler-building-community',label: 'Academias / Equipes',         value: academies, color: 'text-info'    },
    { icon: 'tabler-user-star',         label: 'Treinadores Independentes',   value: coaches,  color: 'text-warning'  },
    { icon: 'tabler-user',              label: 'Atletas Independentes',       value: athletes, color: 'text-success'  },
    { icon: 'tabler-user-check',        label: 'Ativos (página atual)',       value: actives,  color: 'text-secondary'},
  ]

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
      {stats.map(s => (
        <div key={s.label}
          className='flex items-center gap-3 rounded-xl p-4 shadow-sm'
          style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
        >
          <i className={`${s.icon} text-2xl ${s.color}`} />
          <div>
            <p className='text-xl font-bold'>{s.value}</p>
            <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
