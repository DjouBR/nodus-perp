'use client'

import { useState, useEffect, useCallback } from 'react'
import ClientTable from './components/ClientTable'
import ClientFilters from './components/ClientFilters'
import ClientStatsBar from './components/ClientStatsBar'
import ClientAddModal from './components/ClientAddModal'

export default function ClientsView() {
  const [clients, setClients]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page,
      limit: 20,
      ...(search       && { search }),
      ...(roleFilter   && { role: roleFilter }),
      ...(statusFilter && { status: statusFilter }),
    })
    const res  = await fetch(`/api/admin/clients?${params}`)
    const json = await res.json()
    setClients(json.data       ?? [])
    setTotal(json.total        ?? 0)
    setTotalPages(json.totalPages ?? 1)
    setLoading(false)
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => { fetchClients() }, [fetchClients])
  useEffect(() => { setPage(1) }, [search, roleFilter, statusFilter])

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Clientes</h1>
          <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
            Gerencie academias, treinadores independentes e atletas independentes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90'
        >
          <i className='tabler-plus text-base' />
          Novo Cliente
        </button>
      </div>

      <ClientStatsBar total={total} clients={clients} />

      <ClientFilters
        search={search}       onSearch={setSearch}
        role={roleFilter}     onRole={setRoleFilter}
        status={statusFilter} onStatus={setStatusFilter}
      />

      <ClientTable
        clients={clients}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={fetchClients}
      />

      {showModal && (
        <ClientAddModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchClients() }}
        />
      )}
    </div>
  )
}
