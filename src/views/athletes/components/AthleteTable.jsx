'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NodusConfirmDialog from '@/components/NodusConfirmDialog'
import NodusDeleteDialog from '@/components/NodusDeleteDialog'
import NodusToast from '@/components/NodusToast'

const GENDER_LABEL = { M: 'Masc.', F: 'Fem.', other: 'Outro' }

const STATUS_STYLE = {
  active:           { label: 'Ativo',             cls: 'bg-success/15 text-success' },
  inactive:         { label: 'Inativo',            cls: 'bg-warning/15 text-warning' },
  suspended:        { label: 'Suspenso',           cls: 'bg-error/15 text-error'     },
  pending_deletion: { label: 'Exclusão pendente',  cls: 'bg-error/15 text-error'     },
}

function Avatar({ name, avatar_url }) {
  if (avatar_url) return <img src={avatar_url} alt={name} className='h-9 w-9 rounded-full object-cover' />
  const initials = name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors   = ['bg-primary','bg-success','bg-warning','bg-info','bg-error']
  const color    = colors[name?.charCodeAt(0) % colors.length]
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-sm font-semibold text-white`}>
      {initials}
    </div>
  )
}

export default function AthleteTable({
  athletes, loading, page, totalPages, perPage, total, onPageChange, onRefresh, canManage,
  detailBasePath = '/athletes'
}) {
  const router = useRouter()
  const [pendingId,      setPendingId]     = useState(null)
  const [toggleAthl,     setToggleAthl]    = useState(null) // inativar OU reativar
  const [deleteAthl,     setDeleteAthl]    = useState(null) // excluir permanentemente
  const [toast,          setToast]         = useState({ open: false, message: '', severity: 'success' })

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity })

  // ─── Toggle Inativar / Reativar ────────────────────────────────────
  const handleToggle = async () => {
    const a = toggleAthl
    const novoIsActive = a.is_active ? 0 : 1
    const novoStatus   = novoIsActive ? 'active' : 'inactive'
    setPendingId(a.id)
    try {
      const res = await fetch(`/api/athletes/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: novoIsActive, status: novoStatus }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Falha ao atualizar status')
      }
      showToast(
        novoIsActive
          ? `"${a.name}" foi reativado com sucesso`
          : `"${a.name}" foi inativado com sucesso`,
        novoIsActive ? 'success' : 'warning'
      )
      onRefresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingId(null)
      setToggleAthl(null)
    }
  }

  // ─── Excluir permanentemente (hard delete) ─────────────────────────
  const handleDelete = async ({ backup }) => {
    const a = deleteAthl
    setPendingId(a.id)
    try {
      const url = `/api/athletes/${a.id}${backup ? '?backup=1' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Falha ao excluir')
      }
      showToast(
        backup
          ? `"${a.name}" excluído — backup solicitado (implementação futura)`
          : `"${a.name}" foi excluído permanentemente do banco de dados`,
        backup ? 'warning' : 'success'
      )
      onRefresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingId(null)
      setDeleteAthl(null)
    }
  }

  if (loading) return (
    <div className='card rounded-xl p-8 text-center shadow-sm'>
      <i className='tabler-loader-2 animate-spin text-3xl text-primary' />
      <p className='mt-2 text-sm text-textSecondary'>Carregando atletas...</p>
    </div>
  )

  if (!athletes.length) return (
    <div className='card rounded-xl p-12 text-center shadow-sm'>
      <i className='tabler-users-off text-5xl text-textSecondary/40' />
      <p className='mt-3 font-medium'>Nenhum atleta encontrado</p>
      <p className='text-sm text-textSecondary'>Tente ajustar os filtros ou adicione um novo atleta.</p>
    </div>
  )

  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  return (
    <>
      <div className='card overflow-hidden rounded-xl shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border bg-actionHover text-left text-xs uppercase tracking-wide text-textSecondary'>
                <th className='px-5 py-3'>Atleta</th>
                <th className='px-5 py-3'>Contato</th>
                <th className='px-5 py-3'>FC Máx</th>
                <th className='px-5 py-3'>Sensor</th>
                <th className='px-5 py-3'>Status</th>
                <th className='px-5 py-3'>Matrícula</th>
                <th className='px-5 py-3'>Ações</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {athletes.map(a => {
                const statusInfo = STATUS_STYLE[a.profile?.status] ?? STATUS_STYLE.active
                const isBusy     = pendingId === a.id
                const isActive   = Boolean(a.is_active)
                return (
                  <tr key={a.id} className='hover:bg-actionHover transition-colors'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar name={a.name} avatar_url={a.avatar_url} />
                        <div>
                          <p className='font-medium'>{a.name}</p>
                          <p className='text-xs text-textSecondary'>{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3'>
                      <div>
                        <p>{a.phone ?? <span className='text-textSecondary/50'>—</span>}</p>
                        {a.gender && <p className='text-xs text-textSecondary'>{GENDER_LABEL[a.gender]}</p>}
                      </div>
                    </td>
                    <td className='px-5 py-3'>
                      {a.profile?.hr_max
                        ? <span className='font-mono font-semibold text-error'>{a.profile.hr_max} bpm</span>
                        : <span className='text-textSecondary/50'>—</span>}
                    </td>
                    <td className='px-5 py-3'>
                      {a.sensor ? (
                        <div className='flex items-center gap-1.5'>
                          <span className='h-2 w-2 rounded-full bg-success' />
                          <span className='font-mono text-xs'>{a.sensor.serial}</span>
                        </div>
                      ) : (
                        <span className='text-textSecondary/50'>Sem sensor</span>
                      )}
                    </td>
                    <td className='px-5 py-3'>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-xs text-textSecondary'>
                      {a.profile?.enrollment_date
                        ? new Date(a.profile.enrollment_date).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-1'>
                        {/* Ver perfil — sempre visível */}
                        <button title='Ver perfil'
                          onClick={() => router.push(`${detailBasePath}/${a.id}`)}
                          className='rounded-lg p-1.5 text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors'>
                          <i className='tabler-eye text-lg' />
                        </button>

                        {canManage && (
                          <>
                            {/* Editar */}
                            <button title='Editar'
                              onClick={() => router.push(`${detailBasePath}/${a.id}?edit=1`)}
                              className='rounded-lg p-1.5 text-textSecondary hover:bg-info/10 hover:text-info transition-colors'>
                              <i className='tabler-edit text-lg' />
                            </button>

                            {/* Inativar / Reativar — toggle real */}
                            <button
                              title={isActive ? 'Inativar' : 'Reativar'}
                              disabled={isBusy}
                              onClick={() => setToggleAthl(a)}
                              className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                                isActive
                                  ? 'text-textSecondary hover:bg-warning/10 hover:text-warning'
                                  : 'text-success hover:bg-success/10'
                              }`}>
                              <i className={`text-lg ${
                                isBusy && toggleAthl?.id === a.id
                                  ? 'tabler-loader-2 animate-spin'
                                  : isActive ? 'tabler-user-off' : 'tabler-user-check'
                              }`} />
                            </button>

                            {/* Excluir permanentemente */}
                            <button title='Excluir permanentemente'
                              disabled={isBusy}
                              onClick={() => setDeleteAthl(a)}
                              className='rounded-lg p-1.5 text-textSecondary hover:bg-error/10 hover:text-error transition-colors disabled:opacity-50'>
                              <i className={`text-lg ${
                                isBusy && deleteAthl?.id === a.id
                                  ? 'tabler-loader-2 animate-spin' : 'tabler-trash'
                              }`} />
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

        {/* Paginação */}
        <div className='flex items-center justify-between border-t border-border px-5 py-3 text-sm text-textSecondary'>
          <span>Mostrando {from}–{to} de {total}</span>
          <div className='flex items-center gap-1'>
            <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={page <= 1}
              className='rounded-lg p-1.5 hover:bg-actionHover disabled:opacity-30'>
              <i className='tabler-chevron-left' />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '...' ? (
                <span key={`dot-${i}`} className='px-2'>...</span>
              ) : (
                <button key={p} onClick={() => onPageChange(p)}
                  className={`min-w-[2rem] rounded-lg px-2 py-1 ${
                    p === page ? 'bg-primary text-white' : 'hover:bg-actionHover'
                  }`}>{p}</button>
              ))}
            <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className='rounded-lg p-1.5 hover:bg-actionHover disabled:opacity-30'>
              <i className='tabler-chevron-right' />
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo Inativar / Reativar */}
      <NodusConfirmDialog
        open={!!toggleAthl}
        title={toggleAthl?.is_active ? 'Inativar atleta' : 'Reativar atleta'}
        message={
          toggleAthl?.is_active
            ? `Deseja inativar "${toggleAthl?.name}"? O atleta perderá o acesso mas seus dados serão preservados.`
            : `Deseja reativar "${toggleAthl?.name}"? O atleta voltará a ter acesso ao sistema.`
        }
        confirmText={toggleAthl?.is_active ? 'Inativar' : 'Reativar'}
        color={toggleAthl?.is_active ? 'warning' : 'success'}
        loading={pendingId === toggleAthl?.id}
        onConfirm={handleToggle}
        onCancel={() => setToggleAthl(null)}
      />

      {/* Diálogo Excluir (3 botões) */}
      <NodusDeleteDialog
        open={!!deleteAthl}
        title='Excluir atleta permanentemente'
        name={deleteAthl?.name}
        subtitle={deleteAthl?.email}
        items={[
          'Dados pessoais e credenciais de acesso',
          'Ficha esportiva (FC, peso, altura, metas)',
          'Histórico de sessões de treino',
          'Logs diários e índices semanais (ACWR)',
          'Sensores vinculados',
        ]}
        loading={!!pendingId}
        onDelete={handleDelete}
        onCancel={() => setDeleteAthl(null)}
      />

      <NodusToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast(t => ({ ...t, open: false }))}
      />
    </>
  )
}
