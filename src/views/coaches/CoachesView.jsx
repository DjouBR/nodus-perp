'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import CoachTable from './components/CoachTable'
import CoachFilters from './components/CoachFilters'
import CoachAddModal from './components/CoachAddModal'
import CoachStatsBar from './components/CoachStatsBar'

export default function CoachesView() {
  const { data: session } = useSession()

  const [coaches, setCoaches]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [type, setType]             = useState('')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [showModal, setShowModal]   = useState(false)
  const perPage = 10

  const fetchCoaches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, perPage })
      if (search) params.set('search', search)
      if (type)   params.set('type', type)
      const res  = await fetch(`/api/coaches?${params}`)
      const json = await res.json()
      setCoaches(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, type])

  useEffect(() => { fetchCoaches() }, [fetchCoaches])

  // Debounce busca
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const canManage = ['super_admin', 'tenant_admin'].includes(session?.user?.role)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Coaches / Treinadores</h1>
          <p className='text-sm text-textSecondary'>
            {total} treinador{total !== 1 ? 'es' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
          >
            <i className='tabler-plus text-base' />
            Novo Treinador
          </button>
        )}
      </div>

      <CoachStatsBar coaches={coaches} total={total} />

      <CoachFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        type={type}
        setType={(v) => { setType(v); setPage(1) }}
      />

      <CoachTable
        coaches={coaches}
        loading={loading}
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onRefresh={fetchCoaches}
        canManage={canManage}
      />

      {showModal && (
        <CoachAddModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchCoaches() }}
        />
      )}
    </div>
  )
}
