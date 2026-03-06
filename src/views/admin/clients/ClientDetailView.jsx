'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const fmt     = (v, u = '') => (v != null && v !== '') ? `${v}${u}` : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }) : '—'

// Converte qualquer formato de data para yyyy-MM-dd (necessário para <input type="date">)
const toDateInput = d => {
  if (!d) return ''
  // Já está no formato correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  // ISO string ou Date object
  const parsed = new Date(d)
  if (isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const ROLE_CONFIG = {
  tenant_admin: { label: 'Academia / Franquia',     color: 'bg-info/15 text-info',       icon: 'tabler-building-community' },
  coach:        { label: 'Treinador Independente',  color: 'bg-warning/15 text-warning', icon: 'tabler-user-star'           },
  athlete:      { label: 'Atleta Independente',     color: 'bg-success/15 text-success', icon: 'tabler-user'                },
}

const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(n = '') { return AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length] }
function getInitials(n = '') { return n.split(' ').slice(0,2).map(x => x[0]).join('').toUpperCase() }

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
    <div className='flex items-center justify-between py-2'
      style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}
    >
      <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  )
}

export default function ClientDetailView({ clientId }) {
  const router = useRouter()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editForm, setEditForm] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/clients/${clientId}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setEditForm({
          name:      d.name      ?? '',
          email:     d.email     ?? '',
          phone:     d.phone     ?? '',
          document:  d.document  ?? '',
          birthdate: toDateInput(d.birthdate), // normaliza para yyyy-MM-dd
          gender:    d.gender    ?? '',
          is_active: d.is_active ?? 1,
          role:      d.role      ?? '',
        })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [clientId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Falha ao salvar')
      }
      load()
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
      <p>Cliente não encontrado</p>
      <button onClick={() => router.push('/admin/clients')} className='text-sm underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Voltar para Clientes</button>
    </div>
  )

  const rc = ROLE_CONFIG[data.role] ?? ROLE_CONFIG.athlete

  return (
    <div className='flex flex-col gap-6'>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
        <button onClick={() => router.push('/admin/clients')} className='hover:underline' style={{ color: 'var(--mui-palette-primary-main)' }}>Clientes</button>
        <i className='tabler-chevron-right text-base' />
        <span>{data.name}</span>
      </div>

      {/* Hero */}
      <div className='overflow-hidden rounded-xl shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        <div className='h-28 w-full' style={{ background: 'linear-gradient(135deg, #7367F0, #CE9FFC)' }} />
        <div className='px-6 pb-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 -mt-10'>
            <div className='flex items-end gap-4'>
              {data.avatar_url ? (
                <img src={data.avatar_url} alt={data.name} className='h-20 w-20 rounded-full object-cover ring-4 ring-background' />
              ) : (
                <div className='flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ring-4 ring-background'
                  style={{ backgroundColor: avatarColor(data.name) }}>
                  {getInitials(data.name)}
                </div>
              )}
              <div className='pb-1'>
                <h1 className='text-xl font-bold'>{data.name}</h1>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{data.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-2 pb-1'>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${rc.color}`}>
                <i className={rc.icon} />{rc.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                data.is_active ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
              }`}>
                {data.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => setEditMode(v => !v)}
                className='ml-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-action-hover'
              >
                <i className={`text-sm ${editMode ? 'tabler-x' : 'tabler-edit'}`} />
                {editMode ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {!editMode ? (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <Card title='Dados Pessoais' icon='tabler-id-badge'>
              <InfoRow label='Telefone'      value={fmt(data.phone)} />
              <InfoRow label='Gênero'        value={{ M:'Masculino', F:'Feminino', other:'Outro' }[data.gender] ?? '—'} />
              <InfoRow label='Nascimento'    value={fmtDate(data.birthdate)} />
              <InfoRow label='Documento'     value={fmt(data.document)} />
              <InfoRow label='Tipo'          value={rc.label} />
              <InfoRow label='Cadastrado'    value={fmtDate(data.created_at)} />
              <InfoRow label='Último Acesso' value={fmtDT(data.last_login)} />
            </Card>

            {data.tenant && (
              <Card title='Tenant Vinculado' icon='tabler-building'>
                <InfoRow label='Nome'     value={data.tenant.name} />
                <InfoRow label='Tipo'     value={{ franchise:'Franquia', academy:'Academia', trainer:'Equipe' }[data.tenant.type] ?? data.tenant.type} />
                <InfoRow label='Status'   value={data.tenant.status} />
                <InfoRow label='Email'    value={fmt(data.tenant.email)} />
                <InfoRow label='Telefone' value={fmt(data.tenant.phone)} />
              </Card>
            )}

            {data.profile && data.role === 'coach' && (
              <Card title='Perfil Profissional' icon='tabler-certificate'>
                <InfoRow label='CREF'          value={fmt(data.profile.cref)} />
                <InfoRow label='Especialidades' value={fmt(data.profile.specialties)} />
                {data.profile.bio && (
                  <div className='mt-3 rounded-xl p-3' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <p className='text-sm leading-relaxed'>{data.profile.bio}</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className='flex flex-col gap-6'>
            <Card title='Resumo da Conta' icon='tabler-chart-bar'>
              {[
                ['tabler-calendar',   'text-info',    'Membro desde',     fmtDate(data.created_at)],
                ['tabler-login',      'text-warning', 'Último login',      fmtDate(data.last_login)],
                ['tabler-mail-check', 'text-success', 'Email verificado',  data.email_verified ? 'Sim' : 'Não'],
              ].map(([icon, color, label, val]) => (
                <div key={label} className='flex items-center justify-between rounded-xl p-3 mb-2'
                  style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}
                >
                  <div className='flex items-center gap-2'>
                    <i className={`${icon} text-lg ${color}`} />
                    <span className='text-sm'>{label}</span>
                  </div>
                  <span className='text-sm font-semibold'>{val}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      ) : (
        <Card title='Editar Cliente' icon='tabler-edit'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[['Nome completo','name','text'],['Email','email','email'],['Telefone','phone','text'],['Documento','document','text']].map(([lbl,key,type]) => (
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
              <label className='mb-1 block text-sm font-medium'>Tipo de Cliente</label>
              <select value={editForm.role ?? ''} onChange={e => set('role', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'>
                <option value='tenant_admin'>Academia / Franquia</option>
                <option value='coach'>Treinador Independente</option>
                <option value='athlete'>Atleta Independente</option>
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <input type='checkbox' id='is_active_c' checked={!!editForm.is_active}
                onChange={e => set('is_active', e.target.checked ? 1 : 0)}
                className='h-4 w-4 accent-primary' />
              <label htmlFor='is_active_c' className='text-sm'>Ativo</label>
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
    </div>
  )
}
