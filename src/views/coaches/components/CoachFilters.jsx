export default function CoachFilters({ searchInput, setSearchInput, type, setType }) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='relative flex-1 min-w-[220px]'>
        <i className='tabler-search absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary' />
        <input
          type='text'
          placeholder='Buscar por nome ou email...'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className='w-full rounded-lg border bg-backgroundPaper py-2 pl-9 pr-3 text-sm outline-none focus:border-primary'
        />
      </div>

      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className='rounded-lg border bg-backgroundPaper px-3 py-2 text-sm outline-none focus:border-primary'
      >
        <option value=''>Todos os tipos</option>
        <option value='coach'>Independente</option>
        <option value='academy_coach'>Funcionário Academia</option>
      </select>
    </div>
  )
}
