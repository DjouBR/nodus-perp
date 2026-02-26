'use client'

export default function AthleteStatsBar({ athletes, total }) {
  const active   = athletes.filter(a => a.profile?.status === 'active').length
  const inactive = athletes.filter(a => a.profile?.status === 'inactive').length
  const withSensor = athletes.filter(a => a.sensor).length

  const stats = [
    { label: 'Total',        value: total,       icon: 'tabler-users',         color: 'text-primary',   bg: 'bg-primary/10' },
    { label: 'Ativos',       value: active,      icon: 'tabler-user-check',    color: 'text-success',   bg: 'bg-success/10' },
    { label: 'Inativos',     value: inactive,    icon: 'tabler-user-off',      color: 'text-warning',   bg: 'bg-warning/10' },
    { label: 'Com Sensor',   value: withSensor,  icon: 'tabler-bluetooth',     color: 'text-info',      bg: 'bg-info/10'    },
  ]

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
      {stats.map(s => (
        <div key={s.label} className='card flex items-center gap-4 rounded-xl p-4 shadow-sm'>
          <div className={`rounded-lg p-3 ${s.bg}`}>
            <i className={`${s.icon} text-2xl ${s.color}`} />
          </div>
          <div>
            <p className='text-2xl font-bold'>{s.value}</p>
            <p className='text-xs text-textSecondary'>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
