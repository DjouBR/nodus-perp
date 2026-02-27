'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const ROLE_LABELS = {
  super_admin:   { label: 'Super Admin',    icon: 'tabler-shield-star',  color: 'text-error'   },
  tenant_admin:  { label: 'Admin Academia', icon: 'tabler-building',     color: 'text-primary' },
  coach:         { label: 'Coach',          icon: 'tabler-whistle',      color: 'text-success' },
  receptionist:  { label: 'Recepcionista',  icon: 'tabler-id-badge-2',   color: 'text-info'    },
  athlete:       { label: 'Atleta',         icon: 'tabler-run',          color: 'text-warning' },
}

const TABS = [
  { id: 'profile',   icon: 'tabler-user',          label: 'Perfil'     },
  { id: 'activity',  icon: 'tabler-activity',       label: 'Atividade'  },
  { id: 'security',  icon: 'tabler-lock',           label: 'Segurança'  },
]

function Avatar({ name, avatar_url }) {
  if (avatar_url) return <img src={avatar_url} alt={name} className='h-28 w-28 rounded-full object-cover' />
  const initials = name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors   = ['bg-primary','bg-success','bg-warning','bg-info','bg-error']
  const color    = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`flex h-28 w-28 items-center justify-center rounded-full ${color} text-4xl font-bold text-white`}>
      {initials}
    </div>
  )
}

export default function UserProfileView() {
  const { data: session } = useSession()
  const [tab, setTab]     = useState('profile')
  const [saved, setSaved] = useState(false)

  const user    = session?.user
  const roleInfo = ROLE_LABELS[user?.role] ?? ROLE_LABELS.athlete

  if (!user) return (
    <div className='flex h-64 items-center justify-center'>
      <i className='tabler-loader-2 animate-spin text-4xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className='overflow-hidden rounded-2xl shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {/* Capa */}
        <div className='h-40 w-full' style={{
          background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main, #9c27b0) 100%)'
        }} />
        <div className='px-6 pb-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 -mt-14'>
            {/* Avatar */}
            <div className='ring-4 rounded-full inline-block' style={{ outlineColor: 'var(--mui-palette-background-paper)' }}>
              <Avatar name={user.name} avatar_url={user.avatar} />
            </div>
            <div className='pb-2 flex items-center gap-3'>
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${roleInfo.color}`}
                style={{ backgroundColor: `rgb(var(--mui-palette-primary-mainChannel)/0.1)` }}>
                <i className={`${roleInfo.icon} text-base`} />
                {roleInfo.label}
              </span>
            </div>
          </div>
          <div className='mt-3'>
            <h1 className='text-2xl font-bold'>{user.name}</h1>
            <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>{user.email}</p>
          </div>

          {/* Métricas rápidas */}
          <div className='mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              { icon: 'tabler-calendar-check', label: 'Membro desde', value: 'Fev 2026', color: 'text-primary' },
              { icon: 'tabler-building',        label: 'Unidade',      value: user.unit_id ? 'Vinculado' : 'Global', color: 'text-info' },
              { icon: 'tabler-shield',          label: 'Nível de acesso', value: roleInfo.label, color: 'text-success' },
              { icon: 'tabler-check-circle',    label: 'Status',       value: 'Ativo', color: 'text-success' },
            ].map(s => (
              <div key={s.label} className='flex items-center gap-3 rounded-xl p-3'
                style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                <i className={`${s.icon} text-2xl ${s.color}`} />
                <div>
                  <p className='font-semibold text-sm'>{s.value}</p>
                  <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className='flex gap-1 rounded-xl p-1' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className='flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors'
            style={{
              backgroundColor: tab === t.id ? 'var(--mui-palette-primary-main)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--mui-palette-text-secondary)',
            }}
          >
            <i className={`${t.icon} text-base`} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Perfil ────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <div className='rounded-xl p-6 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
              <h3 className='mb-5 font-semibold flex items-center gap-2'>
                <i className='tabler-pencil text-xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
                Informações Pessoais
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2 sm:col-span-1'>
                  <label className='mb-1 block text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Nome completo</label>
                  <input defaultValue={user.name}
                    className='w-full rounded-lg px-3 py-2 text-sm outline-none'
                    style={{ backgroundColor: 'var(--mui-palette-action-hover)', border: '1px solid var(--mui-palette-divider)', color: 'var(--mui-palette-text-primary)' }}
                  />
                </div>
                <div className='col-span-2 sm:col-span-1'>
                  <label className='mb-1 block text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Email</label>
                  <input defaultValue={user.email} disabled
                    className='w-full rounded-lg px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed'
                    style={{ backgroundColor: 'var(--mui-palette-action-hover)', border: '1px solid var(--mui-palette-divider)', color: 'var(--mui-palette-text-primary)' }}
                  />
                </div>
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>Nível de acesso</label>
                  <input value={roleInfo.label} disabled
                    className='w-full rounded-lg px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed'
                    style={{ backgroundColor: 'var(--mui-palette-action-hover)', border: '1px solid var(--mui-palette-divider)', color: 'var(--mui-palette-text-primary)' }}
                  />
                </div>
              </div>
              {saved && (
                <div className='mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm'
                  style={{ backgroundColor: 'rgb(var(--mui-palette-success-mainChannel)/0.1)', color: 'var(--mui-palette-success-main)' }}>
                  <i className='tabler-check' /> Alterações salvas!
                </div>
              )}
              <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
                className='mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors'
                style={{ backgroundColor: 'var(--mui-palette-primary-main)' }}>
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* Coluna direita */}
          <div className='flex flex-col gap-6'>
            <div className='rounded-xl p-6 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
              <h3 className='mb-4 font-semibold flex items-center gap-2'>
                <i className='tabler-shield text-xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
                Permissões
              </h3>
              {[
                { label: 'Ver atletas',      ok: ['super_admin','tenant_admin','coach','receptionist'] },
                { label: 'Criar atletas',    ok: ['super_admin','tenant_admin','coach'] },
                { label: 'Ver sessões',      ok: ['super_admin','tenant_admin','coach','receptionist'] },
                { label: 'Monitoramento',    ok: ['super_admin','tenant_admin','coach'] },
                { label: 'Relatórios',       ok: ['super_admin','tenant_admin'] },
                { label: 'Configurações',    ok: ['super_admin','tenant_admin'] },
              ].map(perm => (
                <div key={perm.label} className='flex items-center justify-between py-2'
                  style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                  <span className='text-sm'>{perm.label}</span>
                  {perm.ok.includes(user.role)
                    ? <i className='tabler-check text-success text-lg' />
                    : <i className='tabler-x text-error text-lg' />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Atividade ─────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <div className='rounded-xl p-8 text-center shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
          <i className='tabler-chart-line text-5xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
          <p className='mt-3 font-medium'>Histórico de atividades</p>
          <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>Em breve — integrado ao sistema de daily logs.</p>
        </div>
      )}

      {/* ── Tab: Segurança ─────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className='rounded-xl p-6 shadow-sm' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
          <h3 className='mb-5 font-semibold flex items-center gap-2'>
            <i className='tabler-lock text-xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
            Alterar Senha
          </h3>
          <div className='flex flex-col gap-4 max-w-md'>
            {['Senha atual','Nova senha','Confirmar nova senha'].map((l, i) => (
              <div key={i}>
                <label className='mb-1 block text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>{l}</label>
                <input type='password' className='w-full rounded-lg px-3 py-2 text-sm outline-none'
                  style={{ backgroundColor: 'var(--mui-palette-action-hover)', border: '1px solid var(--mui-palette-divider)', color: 'var(--mui-palette-text-primary)' }}
                />
              </div>
            ))}
            <button className='rounded-lg px-4 py-2 text-sm font-medium text-white w-fit'
              style={{ backgroundColor: 'var(--mui-palette-primary-main)' }}>
              Atualizar Senha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
