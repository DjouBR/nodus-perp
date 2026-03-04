'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const INITIAL = {
  name: '', email: '', password: '', type: 'academy_coach',
  specialty: '', phone: '', is_active: true
}

export default function CoachAddModal({ onClose, onSuccess }) {
  const { data: session } = useSession()
  const [form, setForm]   = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Nome, email e senha são obrigatórios.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenant_id: session?.user?.tenant_id })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao cadastrar')
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-lg rounded-2xl bg-backgroundPaper shadow-xl'>
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <h2 className='text-lg font-semibold'>Novo Treinador / Coach</h2>
          <button onClick={onClose} className='text-textSecondary hover:text-textPrimary'>
            <i className='tabler-x text-xl' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-6'>
          {error && (
            <div className='rounded-lg bg-error/10 px-4 py-2 text-sm text-error'>{error}</div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <div className='col-span-2'>
              <label className='mb-1 block text-sm font-medium'>Nome completo *</label>
              <input
                type='text'
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Ex: Carlos Souza'
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Email *</label>
              <input
                type='email'
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='email@exemplo.com'
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Senha *</label>
              <input
                type='password'
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Mínimo 6 caracteres'
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Tipo</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
              >
                <option value='academy_coach'>Funcionário da Academia</option>
                <option value='coach'>Independente</option>
              </select>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Telefone</label>
              <input
                type='text'
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='(11) 99999-9999'
              />
            </div>

            <div className='col-span-2'>
              <label className='mb-1 block text-sm font-medium'>Especialidade</label>
              <input
                type='text'
                value={form.specialty}
                onChange={e => set('specialty', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Ex: HIIT, CrossFit, Hyrox'
              />
            </div>

            <div className='col-span-2 flex items-center gap-2'>
              <input
                type='checkbox'
                id='is_active'
                checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className='h-4 w-4 accent-primary'
              />
              <label htmlFor='is_active' className='text-sm'>Ativo</label>
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg border px-4 py-2 text-sm hover:bg-action-hover'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'
            >
              {loading && <i className='tabler-loader-2 animate-spin' />}
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
