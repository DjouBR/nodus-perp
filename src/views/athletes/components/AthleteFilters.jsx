'use client'

export default function AthleteFilters({ searchInput, setSearchInput, status, setStatus }) {
  return (
    <div className='card flex flex-wrap items-center gap-4 rounded-xl p-4 shadow-sm'>
      {/* Busca */}
      <div className='relative flex-1 min-w-[200px]'>
        <i className='tabler-search absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary' />
        <input
          type='text'
          placeholder='Buscar por nome ou email...'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className='w-full rounded-lg border border-border bg-transparent py-2 pl-9 pr-4 text-sm outline-none focus:border-primary'
        />
      </div>

      {/* Filtro status */}
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className='rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary'
      >
        <option value=''>Todos os status</option>
        <option value='active'>Ativo</option>
        <option value='inactive'>Inativo</option>
        <option value='suspended'>Suspenso</option>
      </select>
    </div>
  )
}
