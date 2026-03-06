'use client'

export default function ClientFilters({ search, onSearch, role, onRole, status, onStatus }) {
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-xl p-4 shadow-sm'
      style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
    >
      {/* Busca */}
      <div className='relative flex-1 min-w-[200px]'>
        <i className='tabler-search absolute left-3 top-1/2 -translate-y-1/2 text-base'
          style={{ color: 'var(--mui-palette-text-disabled)' }} />
        <input
          type='text'
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder='Buscar por nome, email ou telefone...'
          className='w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary'
        />
      </div>

      {/* Filtro de role/tipo */}
      <select
        value={role}
        onChange={e => onRole(e.target.value)}
        className='rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
      >
        <option value=''>Todos os tipos</option>
        <option value='tenant_admin'>Academia / Franquia</option>
        <option value='coach'>Treinador Independente</option>
        <option value='athlete'>Atleta Independente</option>
      </select>

      {/* Filtro de status */}
      <select
        value={status}
        onChange={e => onStatus(e.target.value)}
        className='rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
      >
        <option value=''>Todos os status</option>
        <option value='active'>Ativo</option>
        <option value='inactive'>Inativo</option>
      </select>
    </div>
  )
}
