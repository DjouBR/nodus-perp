'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPE_LABELS = {
  coach:         { label: 'Independente',  color: 'bg-warning/10 text-warning'  },
  academy_coach: { label: 'Funcionário',   color: 'bg-info/10 text-info'        },
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const AVATAR_COLORS = ['#7367F0','#28C76F','#FF9F43','#00CFE8','#EA5455']
function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function CoachTable({
  coaches, loading, page, totalPages, onPageChange, onRefresh, canManage
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm('Remover este treinador?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/coaches/${id}`, { method: 'DELETE' })
      onRefresh()
    } finally {
      setDeletingId(null)
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
              {canManage && <th className='px-4 py-3 text-right'>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {coaches.map(c => {
              const typeInfo = TYPE_LABELS[c.type] ?? { label: c.type, color: 'bg-secondary/10 text-secondary' }
              return (
                <tr key={c.id} className='border-b last:border-0 hover:bg-action-hover transition-colors'>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} className='h-9 w-9 rounded-full object-cover' />
                      ) : (
                        <div
                          className='flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white'
                          style={{ backgroundColor: avatarColor(c.name) }}
                        >
                          {getInitials(c.name)}
                        </div>
                      )}
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
                  {canManage && (
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => router.push(`/coaches/${c.id}`)}
                          className='rounded p-1.5 hover:bg-primary/10 text-primary'
                          title='Ver perfil'
                        >
                          <i className='tabler-eye text-base' />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className='rounded p-1.5 hover:bg-error/10 text-error disabled:opacity-50'
                          title='Remover'
                        >
                          <i className={`text-base ${deletingId === c.id ? 'tabler-loader-2 animate-spin' : 'tabler-trash'}`} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-action-hover'
          >
            ‹ Anterior
          </button>
          <span className='text-sm text-textSecondary'>Página {page} de {totalPages}</span>
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className='rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-action-hover'
          >
            Próxima ›
          </button>
        </div>
      )}
    </div>
  )
}
