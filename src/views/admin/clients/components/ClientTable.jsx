'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NodusConfirmDialog from '@/components/NodusConfirmDialog'
import NodusDeleteDialog from '@/components/NodusDeleteDialog'
import NodusToast from '@/components/NodusToast'

const ROLE_CONFIG = {
  tenant_admin: { label: 'Academia / Franquia',    color: 'bg-info/10 text-info',      icon: 'tabler-building-community' },
  coach:        { label: 'Treinador Independente', color: 'bg-warning/10 text-warning', icon: 'tabler-user-star'           },
  athlete:      { label: 'Atleta Independente',    color: 'bg-success/10 text-success', icon: 'tabler-user'                },
}

// Itens a excluir conforme o role do cliente
const DELETE_ITEMS = {
  coach:         ['Dados pessoais e credenciais', 'Perfil do treinador', 'Histórico de sessões criadas', 'Participações de atletas nas sessões', 'Séries de FC das sessões'],
  academy_coach: ['Dados pessoais e credenciais', 'Perfil do treinador', 'Histórico de sessões criadas', 'Participações de atletas nas sessões', 'Séries de FC das sessões'],
  athlete:       ['Dados pessoais e credenciais', 'Ficha esportiva', 'Histórico de sessões', 'Logs diários e índices semanais (ACWR)', 'Sensores vinculados'],
  academy_athlete: ['Dados pessoais e credenciais', 'Ficha esportiva', 'Histórico de sessões', 'Logs diários e índices semanais (ACWR)', 'Sensores vinculados'],
  coach_athlete:   ['Dados pessoais e credenciais', 'Ficha esportiva', 'Histórico de sessões', 'Logs diários e índices semanais (ACWR)', 'Sensores vinculados'],
  default:       ['Dados pessoais e credenciais de acesso'],
}

const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(name = '') { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function getInitials(name = '') { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

export default function ClientTable({ clients, loading, page, totalPages, onPageChange, onRefresh }) {
  const router = useRouter()
  const [pendingId,      setPendingId]     = useState(null)
  const [toggleClient,   setToggleClient]  = useState(null) // inativar/reativar
  const [deleteClient,   setDeleteClient]  = useState(null) // excluir permanentemente
  const [toast,          setToast]         = useState({ open: false, message: '', severity: 'success' })

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity })

  // ─── Inativar / Reativar (soft) ──────────────────────────────
  const handleToggle = async () => {
    const c = toggleClient
    setPendingId(c.id)
    try {
      const res = await fetch(`/api/admin/clients/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      showToast(`Cliente "${c.name}" ${c.is_active ? 'inativado' : 'reativado'} com sucesso`)
      onRefresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingId(null)
      setToggleClient(null)
    }
  }

  // ─── Excluir permanentemente (hard delete) ───────────────────────
  const handleDelete = async ({ backup }) => {
    const c = deleteClient
    setPendingId(c.id)
    try {
      const url = `/api/admin/clients/${c.id}${backup ? '?backup=1' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Falha ao excluir')
      }
      showToast(
        backup
          ? `"${c.name}" excluído — backup solicitado (implementação futura)`
          : `"${c.name}" foi excluído permanentemente`,
        backup ? 'warning' : 'success'
      )
      onRefresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingId(null)
      setDeleteClient(null)
    }
  }

  if (loading) return (
    <div className='flex items-center justify-center py-16'>
      <i className='tabler-loader-2 animate-spin text-3xl text-primary' />
    </div>
  )

  if (!clients.length) return (
    <div className='flex flex-col items-center justify-center gap-2 rounded-xl border py-16'
      style={{ backgroundColor: 'var(--mui-palette-background-paper)', color: 'var(--mui-palette-text-secondary)' }}>
      <i className='tabler-users-off text-4xl' />
      <p>Nenhum cliente encontrado</p>
    </div>
  )

  return (
    <>
      <div className='flex flex-col gap-4'>
        <div className='overflow-x-auto rounded-xl shadow-sm'
          style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-left text-xs'
                style={{ color: 'var(--mui-palette-text-secondary)', borderColor: 'var(--mui-palette-divider)' }}>
                <th className='px-4 py-3'>Cliente</th>
                <th className='px-4 py-3'>Tipo</th>
                <th className='px-4 py-3'>Tenant / Plano</th>
                <th className='px-4 py-3'>Cadastro</th>
                <th className='px-4 py-3'>Último Acesso</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3 text-right'>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const rc     = ROLE_CONFIG[c.role] ?? { label: c.role, color: 'bg-secondary/10 text-secondary', icon: 'tabler-user' }
                const isBusy = pendingId === c.id
                return (
                  <tr key={c.id} className='border-b last:border-0 transition-colors hover:bg-action-hover'
                    style={{ borderColor: 'var(--mui-palette-divider)' }}>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt={c.name} className='h-9 w-9 rounded-full object-cover' />
                          : <div className='flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white'
                              style={{ backgroundColor: avatarColor(c.name) }}>
                              {getInitials(c.name)}
                            </div>}
                        <div>
                          <p className='font-medium'>{c.name}</p>
                          <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{c.email}</p>
                          {c.phone && <p className='text-xs' style={{ color: 'var(--mui-palette-text-disabled)' }}>{c.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${rc.color}`}>
                        <i className={`${rc.icon} text-xs`} />{rc.label}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      {c.tenant_name ? (
                        <div>
                          <p className='font-medium'>{c.tenant_name}</p>
                          <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                            {{ franchise:'Franquia', academy:'Academia', trainer:'Treinador' }[c.tenant_type] ?? c.tenant_type}
                          </p>
                        </div>
                      ) : <span style={{ color: 'var(--mui-palette-text-disabled)' }}>—</span>}
                    </td>
                    <td className='px-4 py-3 text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{fmtDate(c.created_at)}</td>
                    <td className='px-4 py-3 text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>{fmtDate(c.last_login)}</td>
                    <td className='px-4 py-3'>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end gap-1'>
                        <button onClick={() => router.push(`/admin/clients/${c.id}`)}
                          className='rounded p-1.5 hover:bg-primary/10 text-primary' title='Ver perfil'>
                          <i className='tabler-eye text-base' />
                        </button>
                        <button onClick={() => router.push(`/admin/clients/${c.id}`)}
                          className='rounded p-1.5 text-info hover:bg-info/10' title='Editar'>
                          <i className='tabler-edit text-base' />
                        </button>
                        <button
                          onClick={() => setToggleClient(c)}
                          disabled={isBusy}
                          className={`rounded p-1.5 disabled:opacity-50 ${
                            c.is_active ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                          }`}
                          title={c.is_active ? 'Inativar' : 'Reativar'}>
                          <i className={`text-base ${
                            isBusy ? 'tabler-loader-2 animate-spin'
                            : c.is_active ? 'tabler-user-off' : 'tabler-user-check'
                          }`} />
                        </button>
                        <button
                          onClick={() => setDeleteClient(c)}
                          disabled={isBusy}
                          className='rounded p-1.5 text-error hover:bg-error/10 disabled:opacity-50'
                          title='Excluir permanentemente'>
                          <i className={`text-base ${isBusy ? 'tabler-loader-2 animate-spin' : 'tabler-trash'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className='flex items-center justify-end gap-2'>
            <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={page === 1}
              className='rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-action-hover'>‹ Anterior</button>
            <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>Página {page} de {totalPages}</span>
            <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className='rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-action-hover'>Próxima ›</button>
          </div>
        )}
      </div>

      {/* Diálogo Inativar/Reativar */}
      <NodusConfirmDialog
        open={!!toggleClient}
        title={toggleClient?.is_active ? 'Inativar cliente' : 'Reativar cliente'}
        message={toggleClient?.is_active
          ? `Deseja inativar "${toggleClient?.name}"? O cliente perderá acesso ao sistema.`
          : `Deseja reativar "${toggleClient?.name}"?`}
        confirmText={toggleClient?.is_active ? 'Inativar' : 'Reativar'}
        color={toggleClient?.is_active ? 'warning' : 'success'}
        loading={pendingId === toggleClient?.id}
        onConfirm={handleToggle}
        onCancel={() => setToggleClient(null)}
      />

      {/* Diálogo Excluir (3 botões) */}
      <NodusDeleteDialog
        open={!!deleteClient}
        title='Excluir cliente permanentemente'
        name={deleteClient?.name}
        subtitle={`${deleteClient?.email} — ${ROLE_CONFIG[deleteClient?.role]?.label ?? deleteClient?.role}`}
        items={DELETE_ITEMS[deleteClient?.role] ?? DELETE_ITEMS.default}
        loading={!!pendingId}
        onDelete={handleDelete}
        onCancel={() => setDeleteClient(null)}
      />

      <NodusToast open={toast.open} message={toast.message} severity={toast.severity}
        onClose={() => setToast(t => ({ ...t, open: false }))} />
    </>
  )
}
