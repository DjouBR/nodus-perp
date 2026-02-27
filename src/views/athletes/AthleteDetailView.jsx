'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (val, unit = '') => val ? `${val}${unit}` : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const GENDER  = { M: 'Masculino', F: 'Feminino', other: 'Outro' }
const STATUS_STYLE = {
  active:    { label: 'Ativo',    cls: 'bg-success/15 text-success' },
  inactive:  { label: 'Inativo', cls: 'bg-warning/15 text-warning' },
  suspended: { label: 'Suspenso',cls: 'bg-error/15 text-error'     },
}
const ZONE_COLORS = [
  { bg: 'bg-blue-500/15',  text: 'text-blue-500',  label: 'Z1 Recuperação' },
  { bg: 'bg-green-500/15', text: 'text-green-500', label: 'Z2 Base Aeróbia' },
  { bg: 'bg-yellow-500/15',text: 'text-yellow-500',label: 'Z3 Limiar' },
  { bg: 'bg-orange-500/15',text: 'text-orange-500',label: 'Z4 Anaeróbio' },
  { bg: 'bg-red-500/15',   text: 'text-red-500',   label: 'Z5 Máximo' },
]

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

function ZoneBadge({ zone, minBpm, maxBpm, idx }) {
  const c = ZONE_COLORS[idx] ?? ZONE_COLORS[0]
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${c.bg}`}>
      <div className='flex items-center gap-2'>
        <span className={`text-xs font-bold ${c.text}`}>Z{idx + 1}</span>
        <span className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{c.label}</span>
      </div>
      <span className={`font-mono text-xs font-semibold ${c.text}`}>
        {minBpm}–{maxBpm} bpm
      </span>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AthleteDetailView({ params }) {
  const resolvedParams = use(params)
  const athleteId = resolvedParams.id
  const router    = useRouter()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('overview') // overview | sessions | logs

  useEffect(() => {
    fetch(`/api/athletes/${athleteId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [athleteId])

  if (loading) return (
    <div className='flex h-64 items-center justify-center'>
      <i className='tabler-loader-2 animate-spin text-4xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
    </div>
  )

  if (!data || data.error) return (
    <div className='flex h-64 flex-col items-center justify-center gap-3'>
      <i className='tabler-user-off text-5xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
      <p>Atleta não encontrado</p>
      <button onClick={() => router.back()} className='text-sm underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Voltar</button>
    </div>
  )

  const p      = data.profile ?? {}
  const sensor = data.sensor
  const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.active

  // Zonas de FC calculadas
  const hrMax = p.hr_max
  const zones = hrMax ? [
    { min: Math.round(hrMax * 0.50), max: p.zone1_max ?? Math.round(hrMax * 0.60) },
    { min: p.zone1_max ?? Math.round(hrMax * 0.60), max: p.zone2_max ?? Math.round(hrMax * 0.70) },
    { min: p.zone2_max ?? Math.round(hrMax * 0.70), max: p.zone3_max ?? Math.round(hrMax * 0.80) },
    { min: p.zone3_max ?? Math.round(hrMax * 0.80), max: p.zone4_max ?? Math.round(hrMax * 0.90) },
    { min: p.zone4_max ?? Math.round(hrMax * 0.90), max: hrMax },
  ] : []

  return (
    <div className='flex flex-col gap-6'>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
        <button onClick={() => router.push('/athletes')} className='hover:underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Atletas</button>
        <i className='tabler-chevron-right text-base' />
        <span>{data.name}</span>
      </div>

      {/* ── Hero Card (User-View style) ─────────────────────────────────── */}
      <div className='rounded-xl shadow-sm overflow-hidden' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {/* Banner */}
        <div className='h-32 w-full' style={{
          background: 'linear-gradient(135deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark, #1565c0))'
        }} />
        <div className='px-6 pb-6'>
          {/* Avatar + info principal */}
          <div className='flex flex-wrap items-end justify-between gap-4 -mt-10'>
            <div className='flex items-end gap-4'>
              <div className='rounded-full ring-4' style={{ ringColor: 'var(--mui-palette-background-paper)' }}>
                <Avatar name={data.name} avatar_url={data.avatar_url} size='lg' />
              </div>
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
            </div>
          </div>

          {/* Stats rápidas */}
          <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              { icon: 'tabler-heart-rate-monitor', label: 'FC Máx',   value: fmt(hrMax, ' bpm'), color: 'text-error' },
              { icon: 'tabler-weight',              label: 'Peso',     value: fmt(p.weight_kg, ' kg'), color: 'text-info' },
              { icon: 'tabler-ruler',               label: 'Altura',   value: fmt(p.height_cm, ' cm'), color: 'text-success' },
              { icon: 'tabler-calendar',            label: 'Matrícula',value: fmtDate(p.enrollment_date), color: 'text-primary' },
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

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className='flex gap-1 rounded-xl p-1' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {[['overview','tabler-user','Visão Geral'],['sessions','tabler-run','Sessões'],['logs','tabler-clipboard-list','Daily Logs']].map(([id, icon, label]) => (
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

      {/* ── Tab: Visão Geral ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Coluna esquerda (2/3) */}
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <Card title='Dados Pessoais' icon='tabler-id-badge'>
              <InfoRow label='Telefone'    value={fmt(data.phone)} />
              <InfoRow label='Gênero'      value={GENDER[data.gender] ?? '—'} />
              <InfoRow label='Nascimento'  value={fmtDate(data.birthdate)} />
              <InfoRow label='Documento'   value={fmt(data.document)} />
            </Card>

            <Card title='Ficha Esportiva' icon='tabler-heartbeat'>
              <InfoRow label='FC Máxima'     value={fmt(hrMax, ' bpm')} />
              <InfoRow label='FC Repouso'    value={fmt(p.hr_rest, ' bpm')} />
              <InfoRow label='FC Limiar'     value={fmt(p.hr_threshold, ' bpm')} />
              <InfoRow label='Peso'          value={fmt(p.weight_kg, ' kg')} />
              <InfoRow label='Altura'        value={fmt(p.height_cm, ' cm')} />
              <InfoRow label='% Gordura'     value={fmt(p.body_fat_pct, '%')} />
              {p.goal && (
                <div className='mt-3 rounded-lg p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <p className='text-xs font-medium mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>Objetivo</p>
                  <p className='text-sm'>{p.goal}</p>
                </div>
              )}
            </Card>

            {(p.emergency_contact || p.medical_notes) && (
              <Card title='Emergência & Saúde' icon='tabler-first-aid-kit'>
                {p.emergency_contact && <InfoRow label='Contato' value={p.emergency_contact} />}
                {p.emergency_phone   && <InfoRow label='Telefone' value={p.emergency_phone} />}
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

          {/* Coluna direita (1/3) */}
          <div className='flex flex-col gap-6'>
            {/* ACWR */}
            {data.acwr && (
              <Card title='ACWR' icon='tabler-chart-line'>
                <div className='text-center py-2'>
                  <p className='text-4xl font-bold' style={{ color:
                    data.acwr.acwr_value < 0.8 ? 'var(--mui-palette-info-main)' :
                    data.acwr.acwr_value <= 1.3 ? 'var(--mui-palette-success-main)' :
                    'var(--mui-palette-error-main)'
                  }}>{Number(data.acwr.acwr_value).toFixed(2)}</p>
                  <p className='text-xs mt-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>Índice carga aguda/crônica</p>
                  <p className='text-xs mt-3 rounded-lg px-2 py-1 inline-block' style={{
                    backgroundColor: data.acwr.acwr_value < 0.8 ? 'rgb(var(--mui-palette-info-mainChannel)/0.1)' :
                      data.acwr.acwr_value <= 1.3 ? 'rgb(var(--mui-palette-success-mainChannel)/0.1)' :
                      'rgb(var(--mui-palette-error-mainChannel)/0.1)',
                    color: data.acwr.acwr_value < 0.8 ? 'var(--mui-palette-info-main)' :
                      data.acwr.acwr_value <= 1.3 ? 'var(--mui-palette-success-main)' :
                      'var(--mui-palette-error-main)',
                  }}>
                    {data.acwr.acwr_value < 0.8 ? 'Treino Insuficiente' :
                     data.acwr.acwr_value <= 1.3 ? 'Zona Ideal' : 'Risco de Lesão'}
                  </p>
                </div>
              </Card>
            )}

            {/* Zonas de FC */}
            {zones.length > 0 && (
              <Card title='Zonas de FC' icon='tabler-activity'>
                <div className='flex flex-col gap-2'>
                  {zones.map((z, i) => <ZoneBadge key={i} idx={i} minBpm={z.min} maxBpm={z.max} />)}
                </div>
              </Card>
            )}

            {/* Sensor */}
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

      {/* ── Tab: Sessões ─────────────────────────────────────────────────── */}
      {tab === 'sessions' && (
        <Card title='Últimas Sessões' icon='tabler-run'>
          {data.recent_sessions?.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-left text-xs uppercase' style={{ color: 'var(--mui-palette-text-secondary)', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                    <th className='pb-3 pr-4'>Sessão</th>
                    <th className='pb-3 pr-4'>Data</th>
                    <th className='pb-3 pr-4'>FC Méd</th>
                    <th className='pb-3 pr-4'>FC Máx</th>
                    <th className='pb-3 pr-4'>TRIMP</th>
                    <th className='pb-3'>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_sessions.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                      <td className='py-3 pr-4 font-medium'>{s.session_name}</td>
                      <td className='py-3 pr-4' style={{ color: 'var(--mui-palette-text-secondary)' }}>{fmtDate(s.start_datetime)}</td>
                      <td className='py-3 pr-4'>{fmt(s.avg_hr, ' bpm')}</td>
                      <td className='py-3 pr-4 font-semibold' style={{ color: 'var(--mui-palette-error-main)' }}>{fmt(s.max_hr, ' bpm')}</td>
                      <td className='py-3 pr-4'>{fmt(s.trimp)}</td>
                      <td className='py-3'>{fmt(s.duration_min, ' min')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className='py-8 text-center' style={{ color: 'var(--mui-palette-text-secondary)' }}>Nenhuma sessão registrada</p>
          )}
        </Card>
      )}

      {/* ── Tab: Daily Logs ──────────────────────────────────────────────── */}
      {tab === 'logs' && (
        <Card title='Daily Logs — Últimos 7 dias' icon='tabler-clipboard-list'>
          {data.recent_logs?.length ? (
            <div className='flex flex-col gap-3'>
              {data.recent_logs.map((log, i) => (
                <div key={i} className='flex flex-wrap items-center gap-4 rounded-xl p-4'
                  style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <div className='min-w-[80px]'>
                    <p className='text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Data</p>
                    <p className='font-semibold'>{fmtDate(log.log_date)}</p>
                  </div>
                  <div className='flex flex-wrap gap-4'>
                    {[['Bem-estar','tabler-mood-smile',log.wellness_score,'text-success','/10'],
                      ['Cansaço','tabler-zzz',log.fatigue_score,'text-warning','/10'],
                      ['Dor musc.','tabler-bone',log.muscle_soreness,'text-error','/10'],
                      ['Qualid. Sono','tabler-moon',log.sleep_quality,'text-info','/10'],
                      ['Carga sub.','tabler-chart-bar',log.perceived_load,'text-primary','']
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
