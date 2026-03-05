'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import AthleteTable from '@/views/athletes/components/AthleteTable'
import AthleteFilters from '@/views/athletes/components/AthleteFilters'
import AthleteAddModal from '@/views/athletes/components/AthleteAddModal'
import AthleteStatsBar from '@/views/athletes/components/AthleteStatsBar'

// ─────────────────────────────────────────────────────────────────────────────
// Tela exclusiva do Coach Independente — exibe apenas coach_athlete
// A API já filtra automaticamente por coach_id = session.user.id
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachAthletesView() {
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
      console.error('[CoachAthletesView]', e)
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

  return (
    <div className='flex flex-col gap-6'>

      {/* Cabeçalho */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Meus Alunos</h1>
          <p className='text-sm text-textSecondary'>
            {total} aluno{total !== 1 ? 's' : ''} vinculado{total !== 1 ? 's' : ''} a você
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className='btn-primary flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
        >
          <i className='tabler-plus text-base' />
          Novo Aluno
        </button>
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
        canManage={true}
        detailBasePath='/coach/athletes'
      />

      {/* Modal novo aluno (coach_athlete) */}
      {showModal && (
        <AthleteAddModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchAthletes() }}
        />
      )}

    </div>
  )
}
