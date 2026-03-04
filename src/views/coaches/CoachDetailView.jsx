'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt      = (val, unit = '') => (val != null && val !== '') ? `${val}${unit}` : '—'
const fmtDate  = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtDT    = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const ROLE_LABELS = {
  coach:         { label: 'Independente',      color: 'bg-warning/15 text-warning'   },
  academy_coach: { label: 'Funcionário',        color: 'bg-info/15 text-info'         },
}

const SESSION_STATUS = {
  scheduled: { label: 'Agendada',   color: 'bg-info/15 text-info'         },
  active:    { label: 'Em andamento',color: 'bg-success/15 text-success'  },
  finished:  { label: 'Finalizada', color: 'bg-secondary/15 text-secondary'},
  cancelled: { label: 'Cancelada',  color: 'bg-error/15 text-error'       },
}

const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(name = '') { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function getInitials(name = '') { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }

// ── Sub-componentes ────────────────────────────────────────────────────────
function Avatar({ name = '', avatar_url, size = 'lg' }) {
  const sz = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm'
  if (avatar_url) return <img src={avatar_url} alt={name} className={`${sz} rounded-full object-cover`} />
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ${sz}`}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className='rounded-xl p-5 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
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
    <div
      className='flex items-center justify-between py-2'
      style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}
    >
      <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className='flex items-center gap-3 rounded-xl p-4' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
      <i className={`${icon} text-2xl ${color}`} />
      <div>
        <p className='text-xl font-bold'>{value}</p>
        <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{label}</p>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function CoachDetailView({ params }) {
  const resolvedParams = use(params)
  const coachId  = resolvedParams.id
  const router   = useRouter()

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('overview') // overview | sessions
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetch(`/api/coaches/${coachId}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setEditForm({
          name:        d.name        ?? '',
          email:       d.email       ?? '',
          phone:       d.phone       ?? '',
          birthdate:   d.birthdate   ?? '',
          document:    d.document    ?? '',
          gender:      d.gender      ?? '',
          is_active:   d.is_active   ?? 1,
          role:        d.role        ?? 'academy_coach',
          cref:        d.profile?.cref        ?? '',
          specialties: d.profile?.specialties ?? '',
          bio:         d.profile?.bio         ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [coachId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/coaches/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      // Recarrega dados
      const res = await fetch(`/api/coaches/${coachId}`)
      const updated = await res.json()
      setData(updated)
      setEditMode(false)
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
      <p>Coach não encontrado</p>
      <button onClick={() => router.back()} className='text-sm underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Voltar</button>
    </div>
  )

  const roleInfo = ROLE_LABELS[data.role] ?? ROLE_LABELS.academy_coach
  const p        = data.profile ?? {}
  const stats    = data.stats   ?? {}

  // Especialidades (JSON array ou string)
  let specialtiesList = []
  try { specialtiesList = JSON.parse(p.specialties ?? '[]') } catch { specialtiesList = p.specialties ? [p.specialties] : [] }

  return (
    <div className='flex flex-col gap-6'>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
        <button onClick={() => router.push('/coaches')} className='hover:underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Coaches</button>
        <i className='tabler-chevron-right text-base' />
        <span>{data.name}</span>
      </div>

      {/* ── Hero Card ────────────────────────────────────────────────────── */}
      <div className='overflow-hidden rounded-xl shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {/* Banner */}
        <div className='h-32 w-full' style={{
          background: 'linear-gradient(135deg, var(--mui-palette-secondary-main, #82868b), var(--mui-palette-primary-main))'
        }} />
        <div className='px-6 pb-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 -mt-10'>
            {/* Avatar + nome */}
            <div className='flex items-end gap-4'>
              <Avatar name={data.name} avatar_url={data.avatar_url} size='lg' />
              <div className='pb-1'>
                <h1 className='text-xl font-bold'>{data.name}</h1>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{data.email}</p>
                {p.cref && (
                  <p className='text-xs mt-0.5' style={{ color: 'var(--mui-palette-text-disabled)' }}>
                    CREF: {p.cref}
                  </p>
                )}
              </div>
            </div>

            {/* Badges + botão editar */}
            <div className='flex items-center gap-2 pb-1'>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                data.is_active ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
              }`}>
                {data.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <button
                onClick={() => setEditMode(v => !v)}
                className='ml-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-action-hover'
              >
                <i className={`text-sm ${editMode ? 'tabler-x' : 'tabler-edit'}`} />
                {editMode ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <StatCard icon='tabler-calendar-stats' label='Sessões ministradas' value={stats.total_sessions ?? 0} color='text-primary' />
            <StatCard icon='tabler-users'           label='Atletas atendidos'   value={stats.total_athletes ?? 0} color='text-success' />
            <StatCard icon='tabler-calendar'        label='Membro desde'        value={fmtDate(data.created_at)}  color='text-info'    />
            <StatCard icon='tabler-login'           label='Último acesso'       value={fmtDate(data.last_login)}  color='text-warning' />
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className='flex gap-1 rounded-xl p-1' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {[
          ['overview',  'tabler-user',        'Perfil'],
          ['sessions',  'tabler-calendar-event', 'Sessões'],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
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

      {/* ── Tab: Perfil / Edição ─────────────────────────────────────────── */}
      {tab === 'overview' && !editMode && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Coluna esquerda */}
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <Card title='Dados Pessoais' icon='tabler-id-badge'>
              <InfoRow label='Telefone'    value={fmt(data.phone)} />
              <InfoRow label='Gênero'      value={{ M:'Masculino', F:'Feminino', other:'Outro' }[data.gender] ?? '—'} />
              <InfoRow label='Nascimento'  value={fmtDate(data.birthdate)} />
              <InfoRow label='Documento'   value={fmt(data.document)} />
              <InfoRow label='Tipo'        value={roleInfo.label} />
              <InfoRow label='Cadastrado'  value={fmtDate(data.created_at)} />
            </Card>

            <Card title='Dados Profissionais' icon='tabler-certificate'>
              <InfoRow label='CREF'        value={fmt(p.cref)} />
              <div className='py-3' style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                <p className='mb-2 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>Especialidades</p>
                {specialtiesList.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {specialtiesList.map((s, i) => (
                      <span key={i} className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>{s}</span>
                    ))}
                  </div>
                ) : <span className='text-sm'>—</span>}
              </div>
              {p.bio && (
                <div className='mt-3 rounded-xl p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <p className='mb-1 text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Bio</p>
                  <p className='text-sm leading-relaxed'>{p.bio}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Coluna direita */}
          <div className='flex flex-col gap-6'>
            <Card title='Resumo de Atividade' icon='tabler-chart-bar'>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between rounded-xl p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <div className='flex items-center gap-2'>
                    <i className='tabler-calendar-stats text-xl text-primary' />
                    <span className='text-sm'>Total de Sessões</span>
                  </div>
                  <span className='text-lg font-bold'>{stats.total_sessions ?? 0}</span>
                </div>
                <div className='flex items-center justify-between rounded-xl p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                  <div className='flex items-center gap-2'>
                    <i className='tabler-users text-xl text-success' />
                    <span className='text-sm'>Atletas Atendidos</span>
                  </div>
                  <span className='text-lg font-bold'>{stats.total_athletes ?? 0}</span>
                </div>
              </div>
            </Card>

            {/* Última sessão */}
            {data.recent_sessions?.[0] && (
              <Card title='Última Sessão' icon='tabler-run'>
                <div className='flex flex-col gap-2'>
                  <p className='font-semibold'>{data.recent_sessions[0].name}</p>
                  <InfoRow label='Data'      value={fmtDT(data.recent_sessions[0].start_datetime)} />
                  <InfoRow label='Duração'   value={fmt(data.recent_sessions[0].duration_min, ' min')} />
                  <InfoRow label='Participantes' value={fmt(data.recent_sessions[0].participants_count)} />
                  <InfoRow label='FC Média'  value={fmt(data.recent_sessions[0].avg_hr, ' bpm')} />
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    SESSION_STATUS[data.recent_sessions[0].status]?.color ?? 'bg-secondary/15 text-secondary'
                  }`}>
                    {SESSION_STATUS[data.recent_sessions[0].status]?.label ?? data.recent_sessions[0].status}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Edição ──────────────────────────────────────────────────── */}
      {tab === 'overview' && editMode && (
        <Card title='Editar Coach' icon='tabler-edit'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[['Nome completo', 'name','text'],['Email','email','email'],['Telefone','phone','text'],['Documento (CPF)','document','text']].map(([lbl, key, type]) => (
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
              <label className='mb-1 block text-sm font-medium'>Tipo</label>
              <select value={editForm.role ?? 'academy_coach'} onChange={e => set('role', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'>
                <option value='academy_coach'>Funcionário da Academia</option>
                <option value='coach'>Independente</option>
              </select>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>CREF</label>
              <input type='text' value={editForm.cref ?? ''} onChange={e => set('cref', e.target.value)}
                placeholder='Ex: 012345-G/SP'
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Especialidades (JSON ou texto)</label>
              <input type='text' value={editForm.specialties ?? ''} onChange={e => set('specialties', e.target.value)}
                placeholder='["HIIT","CrossFit"] ou texto livre'
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
            </div>

            <div className='sm:col-span-2'>
              <label className='mb-1 block text-sm font-medium'>Bio profissional</label>
              <textarea rows={3} value={editForm.bio ?? ''} onChange={e => set('bio', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none' />
            </div>

            <div className='flex items-center gap-2'>
              <input type='checkbox' id='is_active_edit' checked={!!editForm.is_active}
                onChange={e => set('is_active', e.target.checked ? 1 : 0)}
                className='h-4 w-4 accent-primary' />
              <label htmlFor='is_active_edit' className='text-sm'>Ativo</label>
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

      {/* ── Tab: Sessões ministradas ─────────────────────────────────────── */}
      {tab === 'sessions' && (
        <Card title='Sessões Ministradas' icon='tabler-calendar-event'>
          {data.recent_sessions?.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-left text-xs uppercase' style={{
                    color: 'var(--mui-palette-text-secondary)',
                    borderBottom: '1px solid var(--mui-palette-divider)'
                  }}>
                    <th className='pb-3 pr-4'>Sessão</th>
                    <th className='pb-3 pr-4'>Data / Hora</th>
                    <th className='pb-3 pr-4'>Duração</th>
                    <th className='pb-3 pr-4'>Atletas</th>
                    <th className='pb-3 pr-4'>FC Média</th>
                    <th className='pb-3'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_sessions.map(s => {
                    const st = SESSION_STATUS[s.status] ?? { label: s.status, color: 'bg-secondary/15 text-secondary' }
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                        <td className='py-3 pr-4 font-medium'>{s.name}</td>
                        <td className='py-3 pr-4' style={{ color: 'var(--mui-palette-text-secondary)' }}>{fmtDT(s.start_datetime)}</td>
                        <td className='py-3 pr-4'>{fmt(s.duration_min, ' min')}</td>
                        <td className='py-3 pr-4'>{s.participants_count ?? '—'}</td>
                        <td className='py-3 pr-4'>{fmt(s.avg_hr, ' bpm')}</td>
                        <td className='py-3'>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className='py-8 text-center' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              Nenhuma sessão registrada para este coach
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
