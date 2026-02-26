'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import AthleteTable from './components/AthleteTable'
import AthleteFilters from './components/AthleteFilters'
import AthleteAddModal from './components/AthleteAddModal'
import AthleteStatsBar from './components/AthleteStatsBar'

export default function AthletesView() {
  const { data: session } = useSession()

  const [athletes, setAthletes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState('')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [showModal, setShowModal]   = useState(false)
  const perPage = 10

  const fetchAthletes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, perPage })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res  = await fetch(`/api/athletes?${params}`)
      const json = await res.json()
      setAthletes(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { fetchAthletes() }, [fetchAthletes])

  // Debounce busca
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const canManage = ['super_admin', 'tenant_admin', 'coach'].includes(session?.user?.role)

  return (
    <div className='flex flex-col gap-6'>
      {/* Cabeçalho */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Atletas</h1>
          <p className='text-sm text-textSecondary'>{total} atleta{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className='btn-primary flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
          >
            <i className='tabler-plus text-base' />
            Novo Atleta
          </button>
        )}
      </div>

      {/* Stats rápidas */}
      <AthleteStatsBar athletes={athletes} total={total} />

      {/* Filtros e busca */}
      <AthleteFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        status={status}
        setStatus={(v) => { setStatus(v); setPage(1) }}
      />

      {/* Tabela */}
      <AthleteTable
        athletes={athletes}
        loading={loading}
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onRefresh={fetchAthletes}
        canManage={canManage}
      />

      {/* Modal novo atleta */}
      {showModal && (
        <AthleteAddModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchAthletes() }}
        />
      )}
    </div>
  )
}
