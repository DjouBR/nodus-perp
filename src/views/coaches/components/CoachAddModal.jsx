'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const INITIAL = { name: '', email: '', password: '', specialty: '', phone: '' }

export default function CoachAddModal({ onClose, onSuccess }) {
  const { data: session } = useSession()
  const [form, setForm]       = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Nome, email e senha s\u00e3o obrigat\u00f3rios.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter no m\u00ednimo 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenant_id: session?.user?.tenant_id }),
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

  // Informa ao usu\u00e1rio qual role ser\u00e1 criado automaticamente
  const rolePreview = session?.user?.role === 'super_admin'
    ? { label: 'Coach Independente', color: 'text-warning', icon: 'tabler-user-star' }
    : { label: 'Professor da Academia', color: 'text-info',    icon: 'tabler-school' }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-lg rounded-2xl shadow-xl' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4' style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
          <div>
            <h2 className='text-lg font-semibold'>Novo Coach / Treinador</h2>
            {/* Badge mostrando qual role ser\u00e1 criado */}
            <div className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${rolePreview.color}`}>
              <i className={`${rolePreview.icon} text-sm`} />
              Ser\u00e1 cadastrado como: <strong>{rolePreview.label}</strong>
            </div>
          </div>
          <button onClick={onClose} className='rounded-lg p-1 hover:bg-action-hover'>
            <i className='tabler-x text-xl' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-6'>
          {error && (
            <div className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm'
              style={{ backgroundColor: 'rgb(var(--mui-palette-error-mainChannel)/0.1)', color: 'var(--mui-palette-error-main)' }}>
              <i className='tabler-alert-circle text-base' />{error}
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <div className='col-span-2'>
              <label className='mb-1 block text-sm font-medium'>Nome completo *</label>
              <input type='text' value={form.name} onChange={e => set('name', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Ex: Carlos Souza' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Email *</label>
              <input type='email' value={form.email} onChange={e => set('email', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='email@exemplo.com' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Senha provis\u00f3ria *</label>
              <input type='password' value={form.password} onChange={e => set('password', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='M\u00ednimo 6 caracteres' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Telefone</label>
              <input type='text' value={form.phone} onChange={e => set('phone', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='(11) 99999-9999' />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>Especialidade</label>
              <input type='text' value={form.specialty} onChange={e => set('specialty', e.target.value)}
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
                placeholder='Ex: HIIT, CrossFit, Hyrox' />
            </div>
          </div>

          <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>
            <i className='tabler-info-circle mr-1' />
            O professor receber\u00e1 um link por email para redefinir a senha (pr\u00f3xima fase).
          </p>

          <div className='flex justify-end gap-3 pt-2'>
            <button type='button' onClick={onClose}
              className='rounded-lg border px-4 py-2 text-sm hover:bg-action-hover'>Cancelar</button>
            <button type='submit' disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'>
              {loading && <i className='tabler-loader-2 animate-spin' />}
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
