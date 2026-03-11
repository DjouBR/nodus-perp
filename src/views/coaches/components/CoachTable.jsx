'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NodusConfirmDialog from '@/components/NodusConfirmDialog'
import NodusDeleteDialog from '@/components/NodusDeleteDialog'
import NodusToast from '@/components/NodusToast'

const TYPE_LABELS = {
  coach:         { label: 'Independente', color: 'bg-warning/10 text-warning' },
  academy_coach: { label: 'Funcionário',  color: 'bg-info/10 text-info'       },
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function CoachTable({ coaches, loading, page, totalPages, onPageChange, onRefresh, canManage }) {
  const router = useRouter()
  const [inactivateCoach, setInactivateCoach] = useState(null)
  const [deleteCoach,     setDeleteCoach]     = useState(null)
  const [pending,         setPending]         = useState(null)
  const [toast,           setToast]           = useState({ open: false, message: '', severity: 'success' })

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity })

  // ─── Inativar (soft — apenas is_active=0) ───────────────────────────
  const handleInactivate = async () => {
    const c = inactivateCoach
    setPending(c.id)
    try {
      const res = await fetch(`/api/coaches/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      showToast(`Treinador "${c.name}" ${c.is_active ? 'inativado' : 'reativado'} com sucesso`)
      onRefresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPending(null)
      setInactivateCoach(null)
    }
  }

  // ─── Excluir permanentemente (hard delete) ────────────────────────
  const handleDelete = async ({ backup }) => {
    const c = deleteCoach
    setPending(c.id)
    try {
      const url = `/api/coaches/${c.id}${backup ? '?backup=1' : ''}`
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
      setPending(null)
      setDeleteCoach(null)
    }
  }

  if (loading) return (
    <div className='flex items-center justify-center py-16'>
      <i className='tabler-loader-2 animate-spin text-3xl text-primary' />
    </div>
  )

  if (!coaches.length) return (
    <div className='flex flex-col items-center justify-center gap-2 rounded-xl border bg-backgroundPaper py-16 text-textSecondary'>
      <i className='tabler-user-off text-4xl' />
      <p>Nenhum treinador encontrado</p>
    </div>
  )

  return (
    <>
      <div className='flex flex-col gap-4'>
        <div className='overflow-x-auto rounded-xl border bg-backgroundPaper shadow-sm'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-left text-xs text-textSecondary'>
                <th className='px-4 py-3'>Treinador</th>
                <th className='px-4 py-3'>Tipo</th>
                <th className='px-4 py-3'>Especialidade</th>
                <th className='px-4 py-3'>Atletas</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3 text-right'>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map(c => {
                const typeInfo = TYPE_LABELS[c.type] ?? { label: c.type, color: 'bg-secondary/10 text-secondary' }
                const isBusy  = pending === c.id
                return (
                  <tr key={c.id} className='border-b last:border-0 hover:bg-action-hover transition-colors'>
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
                          <p className='text-xs text-textSecondary'>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-textSecondary'>{c.specialty ?? '—'}</td>
                    <td className='px-4 py-3'>{c.athlete_count ?? 0}</td>
                    <td className='px-4 py-3'>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end gap-1'>
                        {/* Ver perfil — sempre visível */}
                        <button onClick={() => router.push(`/coaches/${c.id}`)}
                          className='rounded p-1.5 hover:bg-primary/10 text-primary' title='Ver perfil'>
                          <i className='tabler-eye text-base' />
                        </button>
                        {canManage && (
                          <>
                            {/* Editar */}
                            <button onClick={() => router.push(`/coaches/${c.id}?edit=1`)}
                              className='rounded p-1.5 hover:bg-info/10 text-info' title='Editar'>
                              <i className='tabler-edit text-base' />
                            </button>
                            {/* Inativar / Reativar */}
                            <button
                              onClick={() => setInactivateCoach(c)}
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
                            {/* Excluir permanentemente */}
                            <button
                              onClick={() => setDeleteCoach(c)}
                              disabled={isBusy}
                              className='rounded p-1.5 hover:bg-error/10 text-error disabled:opacity-50'
                              title='Excluir permanentemente'>
                              <i className={`text-base ${isBusy ? 'tabler-loader-2 animate-spin' : 'tabler-trash'}`} />
                            </button>
                          </>
                        )}
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
            <span className='text-sm text-textSecondary'>Página {page} de {totalPages}</span>
            <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className='rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-action-hover'>Próxima ›</button>
          </div>
        )}
      </div>

      {/* Diálogo Inativar/Reativar */}
      <NodusConfirmDialog
        open={!!inactivateCoach}
        title={inactivateCoach?.is_active ? 'Inativar treinador' : 'Reativar treinador'}
        message={inactivateCoach?.is_active
          ? `Deseja inativar "${inactivateCoach?.name}"? O treinador perderá acesso ao sistema.`
          : `Deseja reativar "${inactivateCoach?.name}"?`}
        confirmText={inactivateCoach?.is_active ? 'Inativar' : 'Reativar'}
        color={inactivateCoach?.is_active ? 'warning' : 'success'}
        loading={pending === inactivateCoach?.id}
        onConfirm={handleInactivate}
        onCancel={() => setInactivateCoach(null)}
      />

      {/* Diálogo Excluir (3 botões) */}
      <NodusDeleteDialog
        open={!!deleteCoach}
        title='Excluir treinador permanentemente'
        name={deleteCoach?.name}
        subtitle={deleteCoach?.email}
        items={[
          'Dados pessoais e credenciais de acesso',
          'Perfil e certificados do treinador',
          'Histórico de sessões de treino criadas por ele',
          'Participações de atletas nessas sessões',
          'Séries de FC das sessões',
        ]}
        loading={!!pending}
        onDelete={handleDelete}
        onCancel={() => setDeleteCoach(null)}
      />

      <NodusToast open={toast.open} message={toast.message} severity={toast.severity}
        onClose={() => setToast(t => ({ ...t, open: false }))} />
    </>
  )
}
