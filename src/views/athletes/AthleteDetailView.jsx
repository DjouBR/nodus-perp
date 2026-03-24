'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

// ── Helpers ──────────────────────────────────────────────────────────────────────
const fmt     = (val, unit = '') => val ? `${val}${unit}` : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtDateShort = d => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
const fmtTime = d => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
const GENDER  = { M: 'Masculino', F: 'Feminino', other: 'Outro' }
const STATUS_STYLE = {
  active:    { label: 'Ativo',    cls: 'bg-success/15 text-success' },
  inactive:  { label: 'Inativo',  cls: 'bg-warning/15 text-warning' },
  suspended: { label: 'Suspenso', cls: 'bg-error/15 text-error'     },
}
const ZONE_COLORS = [
  { bg: 'bg-blue-500/15',   text: 'text-blue-500',   label: 'Z1 Recuperação'  },
  { bg: 'bg-green-500/15',  text: 'text-green-500',  label: 'Z2 Base Aeróbia' },
  { bg: 'bg-yellow-500/15', text: 'text-yellow-500', label: 'Z3 Limiar'       },
  { bg: 'bg-orange-500/15', text: 'text-orange-500', label: 'Z4 Anaeróbio'   },
  { bg: 'bg-red-500/15',    text: 'text-red-500',    label: 'Z5 Máximo'       },
]

// Calcula total de tempo em zonas em segundos e retorna percentuais
const calcZonePcts = s => {
  const total = (s.time_z1_sec||0)+(s.time_z2_sec||0)+(s.time_z3_sec||0)+(s.time_z4_sec||0)+(s.time_z5_sec||0)
  if (!total) return null
  return [
    Math.round((s.time_z1_sec||0)/total*100),
    Math.round((s.time_z2_sec||0)/total*100),
    Math.round((s.time_z3_sec||0)/total*100),
    Math.round((s.time_z4_sec||0)/total*100),
    Math.round((s.time_z5_sec||0)/total*100),
  ]
}

// Normaliza qualquer formato de data para yyyy-MM-dd
const toDateInput = d => {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const parsed = new Date(d)
  if (isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

function Avatar({ name, avatar_url, size = 'lg' }) {
  const sz = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm'
  if (avatar_url) return <img src={avatar_url} alt={name} className={`${sz} rounded-full object-cover`} />
  const initials = name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors   = ['bg-primary','bg-success','bg-warning','bg-info','bg-error']
  const color    = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`flex items-center justify-center rounded-full ${sz} ${color} font-bold text-white`}>
      {initials}
    </div>
  )
}

function Card({ title, icon, children, className = '' }) {
  return (
    <div className={`rounded-xl p-5 shadow-sm ${className}`}
      style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
      {title && (
        <div className='mb-4 flex items-center gap-2'>
          {icon && <i className={`${icon} text-xl`} style={{ color: 'var(--mui-palette-primary-main)' }} />}
          <h3 className='font-semibold'>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className='flex items-center justify-between py-2'
      style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
      <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  )
}

function ZoneBadge({ minBpm, maxBpm, idx }) {
  const c = ZONE_COLORS[idx] ?? ZONE_COLORS[0]
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${c.bg}`}>
      <div className='flex items-center gap-2'>
        <span className={`text-xs font-bold ${c.text}`}>Z{idx + 1}</span>
        <span className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{c.label}</span>
      </div>
      <span className={`font-mono text-xs font-semibold ${c.text}`}>{minBpm}–{maxBpm} bpm</span>
    </div>
  )
}

// ── Componente de card de sessão expandível ───────────────────────────────────
function SessionCard({ s }) {
  const [open, setOpen] = useState(false)
  const zonePcts = calcZonePcts(s)
  const dt = new Date(s.start_datetime)
  const day = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const hour = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className='rounded-xl overflow-hidden transition-shadow hover:shadow-md cursor-pointer'
      style={{ border: '1px solid var(--mui-palette-divider)' }}
      onClick={() => setOpen(o => !o)}
    >
      {/* Linha principal */}
      <div className='flex items-center gap-4 px-4 py-3'>
        {/* Bloco de data */}
        <div className='flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[52px]'
          style={{ backgroundColor: 'var(--mui-palette-primary-main)', color: '#fff' }}>
          <span className='text-xs font-bold leading-none'>{day.split(' ')[0]}</span>
          <span className='text-[10px] leading-none mt-0.5 opacity-80'>{day.split(' ')[1]}</span>
        </div>

        {/* Nome + tipo + hora */}
        <div className='flex-1 min-w-0'>
          <p className='font-semibold text-sm truncate'>{s.session_name}</p>
          <div className='flex items-center gap-2 mt-0.5'>
            <span className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{hour}</span>
            {s.duration_min && (
              <span className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>· {s.duration_min} min</span>
            )}
            {s.type_name && (
              <span
                className='rounded-full px-2 py-0.5 text-[10px] font-semibold'
                style={{
                  backgroundColor: s.type_color ? `${s.type_color}22` : 'var(--mui-palette-action-hover)',
                  color: s.type_color ?? 'var(--mui-palette-text-secondary)',
                }}
              >{s.type_name}</span>
            )}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className='flex items-center gap-4'>
          {s.avg_hr && (
            <div className='flex flex-col items-center'>
              <span className='text-sm font-semibold' style={{ color: 'var(--mui-palette-error-main)' }}>{s.avg_hr}</span>
              <span className='text-[10px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>FC méd</span>
            </div>
          )}
          {s.trimp && (
            <div className='flex flex-col items-center'>
              <span className='text-sm font-semibold' style={{ color: 'var(--mui-palette-primary-main)' }}>{s.trimp}</span>
              <span className='text-[10px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>TRIMP</span>
            </div>
          )}
          {s.calories && (
            <div className='flex flex-col items-center'>
              <span className='text-sm font-semibold' style={{ color: 'var(--mui-palette-warning-main)' }}>{s.calories}</span>
              <span className='text-[10px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>kcal</span>
            </div>
          )}
          <i className={`text-base transition-transform ${open ? 'tabler-chevron-up' : 'tabler-chevron-down'}`}
            style={{ color: 'var(--mui-palette-text-secondary)' }} />
        </div>
      </div>

      {/* Detalhe expandido */}
      {open && (
        <div className='px-4 pb-4 pt-2' style={{ borderTop: '1px solid var(--mui-palette-divider)' }}>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3'>
            {[
              { label: 'FC Máxima', value: s.max_hr ? `${s.max_hr} bpm` : '—', color: 'text-error' },
              { label: 'FC Média',  value: s.avg_hr ? `${s.avg_hr} bpm` : '—', color: 'text-warning' },
              { label: 'TRIMP',     value: s.trimp  ? String(s.trimp)   : '—', color: 'text-primary' },
              { label: 'Calorias',  value: s.calories ? `${s.calories} kcal` : '—', color: 'text-success' },
            ].map(m => (
              <div key={m.label} className='rounded-lg p-3 text-center'
                style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                <p className='text-xs mt-0.5' style={{ color: 'var(--mui-palette-text-secondary)' }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Barras de zonas de FC */}
          {zonePcts && (
            <div>
              <p className='text-xs font-medium mb-2' style={{ color: 'var(--mui-palette-text-secondary)' }}>Tempo por Zona de FC</p>
              <div className='flex rounded-full overflow-hidden h-3'>
                {zonePcts.map((pct, i) => pct > 0 && (
                  <div key={i} style={{ width: `${pct}%` }}
                    className={[
                      'bg-blue-500','bg-green-500','bg-yellow-500','bg-orange-500','bg-red-500'
                    ][i]}
                    title={`Z${i+1}: ${pct}%`}
                  />
                ))}
              </div>
              <div className='flex gap-3 mt-1.5 flex-wrap'>
                {zonePcts.map((pct, i) => pct > 0 && (
                  <span key={i} className='text-[10px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                    Z{i+1}: {pct}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Props:
 *   athleteId      {string}   UUID do atleta (ou via params.id)
 *   backPath       {string}   Rota do botão Voltar (default: '/athletes')
 *   canEdit        {boolean}  Sobrescreve a verificação de role (default: undefined → usa session)
 */
export default function AthleteDetailView({ params, athleteId: propAthleteId, backPath = '/athletes', canEdit: canEditProp }) {
  const resolvedParams  = params ? use(params) : null
  const athleteId       = propAthleteId ?? resolvedParams?.id
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const { data: session } = useSession()

  const canEdit = canEditProp ?? ['super_admin', 'tenant_admin', 'coach', 'academy_coach'].includes(session?.user?.role)

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    if (searchParams.get('edit') === '1' && canEdit) setEditMode(true)
  }, [searchParams, canEdit])

  const loadData = () => {
    if (!athleteId) return
    setLoading(true)
    fetch(`/api/athletes/${athleteId}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setEditForm({
          name:      d.name               ?? '',
          email:     d.email              ?? '',
          phone:     d.phone              ?? '',
          birthdate: toDateInput(d.birthdate),
          document:  d.document           ?? '',
          gender:    d.gender             ?? '',
          is_active: d.is_active          ?? 1,
          hr_max:    d.profile?.hr_max    ?? '',
          hr_rest:   d.profile?.hr_rest   ?? '',
          weight_kg: d.profile?.weight_kg ?? '',
          height_cm: d.profile?.height_cm ?? '',
          goal:      d.profile?.goal      ?? '',
        })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [athleteId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Falha ao salvar')
      }
      loadData()
      setEditMode(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  if (loading) return (
    <div className='flex h-64 items-center justify-center'>
      <i className='tabler-loader-2 animate-spin text-4xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
    </div>
  )

  if (!data || data.error) return (
    <div className='flex h-64 flex-col items-center justify-center gap-3'>
      <i className='tabler-user-off text-5xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
      <p>Atleta não encontrado</p>
      <button onClick={() => router.push(backPath)} className='text-sm underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Voltar</button>
    </div>
  )

  const p      = data.profile ?? {}
  const sensor = data.sensor
  const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.active
  const hrMax  = p.hr_max
  const zones  = hrMax ? [
    { min: Math.round(hrMax * 0.50), max: p.zone1_max ?? Math.round(hrMax * 0.60) },
    { min: p.zone1_max ?? Math.round(hrMax * 0.60), max: p.zone2_max ?? Math.round(hrMax * 0.70) },
    { min: p.zone2_max ?? Math.round(hrMax * 0.70), max: p.zone3_max ?? Math.round(hrMax * 0.80) },
    { min: p.zone3_max ?? Math.round(hrMax * 0.80), max: p.zone4_max ?? Math.round(hrMax * 0.90) },
    { min: p.zone4_max ?? Math.round(hrMax * 0.90), max: hrMax },
  ] : []

  const sessions = data.recent_sessions ?? []

  return (
    <div className='flex flex-col gap-6'>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
        <button onClick={() => router.push(backPath)} className='hover:underline' style={{ color: 'var(--mui-palette-primary-main)' }}>
          {backPath.includes('coach') ? 'Meus Alunos' : 'Atletas'}
        </button>
        <i className='tabler-chevron-right text-base' />
        <span>{data.name}</span>
      </div>

      {/* Hero */}
      <div className='rounded-xl shadow-sm overflow-hidden' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        <div className='h-32 w-full' style={{ background: 'linear-gradient(135deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark, #1565c0))' }} />
        <div className='px-6 pb-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 -mt-10'>
            <div className='flex items-end gap-4'>
              <Avatar name={data.name} avatar_url={data.avatar_url} size='lg' />
              <div className='pb-1'>
                <h1 className='text-xl font-bold'>{data.name}</h1>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{data.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 pb-1'>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
              {sensor && (
                <span className='flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-info/15 text-info'>
                  <i className='tabler-bluetooth text-sm' />Sensor #{sensor.serial}
                </span>
              )}
              {canEdit && (
                <button
                  onClick={() => setEditMode(v => !v)}
                  className='ml-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-action-hover'
                >
                  <i className={`text-sm ${editMode ? 'tabler-x' : 'tabler-edit'}`} />
                  {editMode ? 'Cancelar' : 'Editar'}
                </button>
              )}
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              { icon: 'tabler-heart-rate-monitor', label: 'FC Máx',    value: fmt(hrMax, ' bpm'),          color: 'text-error'   },
              { icon: 'tabler-weight',              label: 'Peso',      value: fmt(p.weight_kg, ' kg'),    color: 'text-info'    },
              { icon: 'tabler-ruler',               label: 'Altura',    value: fmt(p.height_cm, ' cm'),    color: 'text-success' },
              { icon: 'tabler-calendar',            label: 'Matrícula', value: fmtDate(p.enrollment_date), color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className='flex items-center gap-3 rounded-xl p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                <i className={`${s.icon} text-2xl ${s.color}`} />
                <div>
                  <p className='font-semibold'>{s.value}</p>
                  <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 rounded-xl p-1' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {[
          ['overview', 'tabler-user',           'Visão Geral'],
          ['sessions', 'tabler-run',             `Sessões${sessions.length ? ` (${sessions.length})` : ''}`],
          ['logs',     'tabler-clipboard-list',  'Daily Logs'],
        ].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className='flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors'
            style={{
              backgroundColor: tab === id ? 'var(--mui-palette-primary-main)' : 'transparent',
              color: tab === id ? '#fff' : 'var(--mui-palette-text-secondary)',
            }}
          >
            <i className={`${icon} text-base`} />{label}
          </button>
        ))}
      </div>

      {/* Tab: Visão Geral (visualização) */}
      {tab === 'overview' && !editMode && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <Card title='Dados Pessoais' icon='tabler-id-badge'>
              <InfoRow label='Telefone'   value={fmt(data.phone)} />
              <InfoRow label='Gênero'     value={GENDER[data.gender] ?? '—'} />
              <InfoRow label='Nascimento' value={fmtDate(data.birthdate)} />
              <InfoRow label='Documento'  value={fmt(data.document)} />
            </Card>

            <Card title='Ficha Esportiva' icon='tabler-heartbeat'>
              <InfoRow label='FC Máxima'  value={fmt(hrMax, ' bpm')} />
              <InfoRow label='FC Repouso' value={fmt(p.hr_rest, ' bpm')} />
              <InfoRow label='FC Limiar'  value={fmt(p.hr_threshold, ' bpm')} />
              <InfoRow label='Peso'       value={fmt(p.weight_kg, ' kg')} />
              <InfoRow label='Altura'     value={fmt(p.height_cm, ' cm')} />
              <InfoRow label='% Gordura'  value={fmt(p.body_fat_pct, '%')} />
              {p.goal && (
                <div className='mt-3 rounded-lg p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <p className='text-xs font-medium mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>Objetivo</p>
                  <p className='text-sm'>{p.goal}</p>
                </div>
              )}
            </Card>

            {(p.emergency_contact || p.medical_notes) && (
              <Card title='Emergência & Saúde' icon='tabler-first-aid-kit'>
                {p.emergency_contact && <InfoRow label='Contato'  value={p.emergency_contact} />}
                {p.emergency_phone   && <InfoRow label='Telefone' value={p.emergency_phone}   />}
                {p.medical_notes && (
                  <div className='mt-3 rounded-lg p-3' style={{ backgroundColor: 'rgb(var(--mui-palette-warning-mainChannel)/0.08)' }}>
                    <p className='text-xs font-medium mb-1' style={{ color: 'var(--mui-palette-warning-main)' }}>
                      <i className='tabler-alert-triangle mr-1' />Observações médicas
                    </p>
                    <p className='text-sm'>{p.medical_notes}</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className='flex flex-col gap-6'>
            {data.acwr && (
              <Card title='ACWR' icon='tabler-chart-line'>
                <div className='text-center py-2'>
                  <p className='text-4xl font-bold' style={{ color:
                    data.acwr.acwr_value < 0.8  ? 'var(--mui-palette-info-main)'    :
                    data.acwr.acwr_value <= 1.3 ? 'var(--mui-palette-success-main)' :
                    'var(--mui-palette-error-main)'
                  }}>{Number(data.acwr.acwr_value).toFixed(2)}</p>
                  <p className='text-xs mt-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>Índice carga aguda/crônica</p>
                  <p className='text-xs mt-3 rounded-lg px-2 py-1 inline-block' style={{
                    backgroundColor:
                      data.acwr.acwr_value < 0.8  ? 'rgb(var(--mui-palette-info-mainChannel)/0.1)'    :
                      data.acwr.acwr_value <= 1.3 ? 'rgb(var(--mui-palette-success-mainChannel)/0.1)' :
                      'rgb(var(--mui-palette-error-mainChannel)/0.1)',
                    color:
                      data.acwr.acwr_value < 0.8  ? 'var(--mui-palette-info-main)'    :
                      data.acwr.acwr_value <= 1.3 ? 'var(--mui-palette-success-main)' :
                      'var(--mui-palette-error-main)',
                  }}>
                    {data.acwr.acwr_value < 0.8  ? 'Treino Insuficiente' :
                     data.acwr.acwr_value <= 1.3 ? 'Zona Ideal' : 'Risco de Lesão'}
                  </p>
                </div>
              </Card>
            )}

            {zones.length > 0 && (
              <Card title='Zonas de FC' icon='tabler-activity'>
                <div className='flex flex-col gap-2'>
                  {zones.map((z, i) => <ZoneBadge key={i} idx={i} minBpm={z.min} maxBpm={z.max} />)}
                </div>
              </Card>
            )}

            <Card title='Sensor ANT+' icon='tabler-bluetooth'>
              {sensor ? (
                <>
                  <InfoRow label='Serial'  value={sensor.serial} />
                  <InfoRow label='Modelo'  value={fmt(sensor.model)} />
                  <InfoRow label='Bateria' value={sensor.battery_pct ? `${sensor.battery_pct}%` : '—'} />
                  <div className='mt-3 flex items-center gap-2'>
                    <span className='h-2 w-2 rounded-full bg-success' />
                    <span className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>Vinculado</span>
                  </div>
                </>
              ) : (
                <div className='flex flex-col items-center py-4 gap-2'>
                  <i className='tabler-bluetooth-off text-3xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                  <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>Sem sensor vinculado</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Visão Geral (edição) */}
      {tab === 'overview' && editMode && canEdit && (
        <Card title='Editar Atleta' icon='tabler-edit'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[['Nome completo','name','text'],['Email','email','email'],['Telefone','phone','text'],['Documento (CPF)','document','text']].map(([lbl, key, type]) => (
              <div key={key}>
                <label className='mb-1 block text-sm font-medium'>{lbl}</label>
                <input type={type} value={editForm[key] ?? ''} onChange={e => set(key, e.target.value)}
                  className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
              </div>
            ))}

            <div>
              <label className='mb-1 block text-sm font-medium'>Nascimento</label>
              <input type='date' value={editForm.birthdate ?? ''} onChange={e => set('birthdate', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Gênero</label>
              <select value={editForm.gender ?? ''} onChange={e => set('gender', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'>
                <option value=''>Não informado</option>
                <option value='M'>Masculino</option>
                <option value='F'>Feminino</option>
                <option value='other'>Outro</option>
              </select>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>FC Máxima (bpm)</label>
              <input type='number' value={editForm.hr_max ?? ''} onChange={e => set('hr_max', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' placeholder='Ex: 185' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>FC Repouso (bpm)</label>
              <input type='number' value={editForm.hr_rest ?? ''} onChange={e => set('hr_rest', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' placeholder='Ex: 60' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Peso (kg)</label>
              <input type='text' value={editForm.weight_kg ?? ''} onChange={e => set('weight_kg', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' placeholder='Ex: 75.5' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Altura (cm)</label>
              <input type='text' value={editForm.height_cm ?? ''} onChange={e => set('height_cm', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' placeholder='Ex: 175' />
            </div>

            <div className='sm:col-span-2'>
              <label className='mb-1 block text-sm font-medium'>Objetivo</label>
              <textarea rows={2} value={editForm.goal ?? ''} onChange={e => set('goal', e.target.value)}
                className='w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Ex: Perda de peso, condicionamento para Hyrox...' />
            </div>

            <div className='flex items-center gap-2'>
              <input type='checkbox' id='is_active_athlete' checked={!!editForm.is_active}
                onChange={e => set('is_active', e.target.checked ? 1 : 0)}
                className='h-4 w-4 accent-primary' />
              <label htmlFor='is_active_athlete' className='text-sm'>Ativo</label>
            </div>
          </div>

          <div className='mt-6 flex justify-end gap-3'>
            <button onClick={() => setEditMode(false)}
              className='rounded-lg border px-4 py-2 text-sm hover:bg-action-hover'>Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'>
              {saving && <i className='tabler-loader-2 animate-spin' />}
              Salvar alterações
            </button>
          </div>
        </Card>
      )}

      {/* Tab: Sessões — Histórico de participações (checked_in = 1) */}
      {tab === 'sessions' && (
        <div className='flex flex-col gap-4'>
          {/* Resumo estatístico */}
          {sessions.length > 0 && (() => {
            const totalCalories = sessions.reduce((acc, s) => acc + (s.calories || 0), 0)
            const avgHr = sessions.filter(s => s.avg_hr).length
              ? Math.round(sessions.filter(s => s.avg_hr).reduce((a, s) => a + s.avg_hr, 0) / sessions.filter(s => s.avg_hr).length)
              : null
            const totalTrimp = sessions.reduce((acc, s) => acc + (s.trimp || 0), 0)
            return (
              <div className='grid grid-cols-3 gap-3'>
                {[
                  { icon: 'tabler-run',        label: 'Sessões participadas', value: sessions.length,                       color: 'text-primary' },
                  { icon: 'tabler-flame',      label: 'Total kcal',           value: totalCalories ? `${totalCalories} kcal` : '—', color: 'text-warning' },
                  { icon: 'tabler-heart-rate', label: 'FC média geral',       value: avgHr ? `${avgHr} bpm` : '—',          color: 'text-error'   },
                ].map(st => (
                  <div key={st.label} className='rounded-xl p-4 text-center shadow-sm'
                    style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
                    <i className={`${st.icon} text-2xl ${st.color} mb-1`} />
                    <p className='text-lg font-bold'>{st.value}</p>
                    <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{st.label}</p>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Lista de sessões */}
          <Card
            title={`Histórico de Participações${sessions.length ? ` — ${sessions.length} sessão${sessions.length > 1 ? 'ões' : ''}` : ''}`}
            icon='tabler-history'
          >
            {sessions.length ? (
              <div className='flex flex-col gap-3'>
                {sessions.map((s, i) => <SessionCard key={s.session_id ?? i} s={s} />)}
              </div>
            ) : (
              <div className='flex flex-col items-center py-10 gap-3'>
                <i className='tabler-calendar-off text-5xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  Nenhuma sessão participada ainda
                </p>
                <p className='text-xs' style={{ color: 'var(--mui-palette-text-disabled)' }}>
                  As sessões aparecem aqui após o atleta fazer check-in
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Daily Logs */}
      {tab === 'logs' && (
        <Card title='Daily Logs — Últimos 7 dias' icon='tabler-clipboard-list'>
          {data.recent_logs?.length ? (
            <div className='flex flex-col gap-3'>
              {data.recent_logs.map((log, i) => (
                <div key={i} className='flex flex-wrap items-center gap-4 rounded-xl p-4' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <div className='min-w-[80px]'>
                    <p className='text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Data</p>
                    <p className='font-semibold'>{fmtDate(log.log_date)}</p>
                  </div>
                  <div className='flex flex-wrap gap-4'>
                    {[['Bem-estar','tabler-mood-smile',log.wellness_score,'text-success','/10'],
                      ['Cansaço','tabler-zzz',log.fatigue_score,'text-warning','/10'],
                      ['Dor musc.','tabler-bone',log.muscle_soreness,'text-error','/10'],
                      ['Qualid. Sono','tabler-moon',log.sleep_quality,'text-info','/10'],
                      ['Carga sub.','tabler-chart-bar',log.perceived_load,'text-primary',''],
                    ].map(([l, icon, val, color, unit]) => val != null && (
                      <div key={l} className='flex items-center gap-1.5'>
                        <i className={`${icon} text-base ${color}`} />
                        <div>
                          <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{l}</p>
                          <p className='font-semibold'>{val}{unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {log.notes && <p className='w-full text-xs italic' style={{ color: 'var(--mui-palette-text-secondary)' }}>{log.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className='py-8 text-center' style={{ color: 'var(--mui-palette-text-secondary)' }}>Nenhum log registrado</p>
          )}
        </Card>
      )}
    </div>
  )
}
