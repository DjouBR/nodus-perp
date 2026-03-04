export default function CoachStatsBar({ coaches, total }) {
  const ativos    = coaches.filter(c => c.is_active).length
  const inativos  = coaches.filter(c => !c.is_active).length
  const independentes = coaches.filter(c => c.type === 'coach').length
  const funcionarios  = coaches.filter(c => c.type === 'academy_coach').length

  const cards = [
    { label: 'Total',          value: total,        icon: 'tabler-users',          color: 'text-primary'   },
    { label: 'Ativos',         value: ativos,       icon: 'tabler-user-check',     color: 'text-success'   },
    { label: 'Inativos',       value: inativos,     icon: 'tabler-user-off',       color: 'text-error'     },
    { label: 'Independentes',  value: independentes,icon: 'tabler-user-star',      color: 'text-warning'   },
    { label: 'Funcionários',   value: funcionarios, icon: 'tabler-building-community', color: 'text-info'  },
  ]

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-5'>
      {cards.map(c => (
        <div key={c.label} className='flex items-center gap-3 rounded-xl border bg-backgroundPaper p-4 shadow-sm'>
          <i className={`${c.icon} text-2xl ${c.color}`} />
          <div>
            <p className='text-xl font-bold'>{c.value}</p>
            <p className='text-xs text-textSecondary'>{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
