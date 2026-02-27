'use client'

import { useState } from 'react'

const INITIAL = {
  name: '', email: '', phone: '', gender: '', birthdate: '',
  hr_max: '', hr_rest: '', weight_kg: '', height_cm: '', body_fat_pct: '',
  goal: '', emergency_contact: '', emergency_phone: '',
}

export default function AthleteAddModal({ onClose, onSuccess }) {
  const [form, setForm]       = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState(1)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao criar atleta'); return }
      onSuccess()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Overlay — usa a variável CSS do tema MUI para o backdrop
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'var(--backdrop-color)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Caixa do modal — usa backgroundPaper do MUI (funciona em dark/light) */}
      <div
        className='w-full max-w-lg rounded-2xl shadow-2xl'
        style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
      >
        {/* Header */}
        <div
          className='flex items-center justify-between px-6 py-4'
          style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}
        >
          <div>
            <h2 className='text-lg font-semibold' style={{ color: 'var(--mui-palette-text-primary)' }}>Novo Atleta</h2>
            <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>Passo {step} de 2</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-lg p-1.5 transition-colors hover:bg-[var(--mui-palette-action-hover)]'
          >
            <i className='tabler-x text-xl' style={{ color: 'var(--mui-palette-text-secondary)' }} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className='flex gap-1 px-6 pt-4'>
          {[1, 2].map(s => (
            <div
              key={s}
              className='h-1 flex-1 rounded-full transition-colors'
              style={{ backgroundColor: s <= step ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)' }}
            />
          ))}
        </div>

        {/* Body */}
        <div className='space-y-4 px-6 py-4'>
          {error && (
            <div
              className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm'
              style={{ backgroundColor: 'rgb(var(--mui-palette-error-mainChannel)/0.12)', color: 'var(--mui-palette-error-main)' }}
            >
              <i className='tabler-alert-circle' />{error}
            </div>
          )}

          {step === 1 && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <Label>Nome completo *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder='Ex: Ana Paula Souza' />
              </div>
              <div className='col-span-2'>
                <Label>Email *</Label>
                <Input type='email' value={form.email} onChange={e => set('email', e.target.value)} placeholder='atleta@email.com' />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder='(19) 99999-0000' />
              </div>
              <div>
                <Label>Gênero</Label>
                <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value=''>Selecionar</option>
                  <option value='M'>Masculino</option>
                  <option value='F'>Feminino</option>
                  <option value='other'>Outro</option>
                </Select>
              </div>
              <div className='col-span-2'>
                <Label>Data de nascimento</Label>
                <Input type='date' value={form.birthdate} onChange={e => set('birthdate', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>FC Máxima (bpm)</Label>
                <Input type='number' value={form.hr_max} onChange={e => set('hr_max', e.target.value)} placeholder='Ex: 190' />
              </div>
              <div>
                <Label>FC Repouso (bpm)</Label>
                <Input type='number' value={form.hr_rest} onChange={e => set('hr_rest', e.target.value)} placeholder='Ex: 60' />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input type='number' value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder='Ex: 75' />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input type='number' value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder='Ex: 175' />
              </div>
              <div className='col-span-2'>
                <Label>Objetivo</Label>
                <textarea
                  value={form.goal} onChange={e => set('goal', e.target.value)}
                  rows={2} placeholder='Ex: Perda de peso, condicionamento...'
                  className='w-full resize-none rounded-lg px-3 py-2 text-sm outline-none transition-colors'
                  style={{
                    backgroundColor: 'var(--mui-palette-action-hover)',
                    border: '1px solid var(--mui-palette-divider)',
                    color: 'var(--mui-palette-text-primary)',
                  }}
                />
              </div>
              <div>
                <Label>Contato emergência</Label>
                <Input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder='Nome' />
              </div>
              <div>
                <Label>Tel. emergência</Label>
                <Input value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} placeholder='(19) 99999-0000' />
              </div>
              <div className='col-span-2'>
                <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  <i className='tabler-info-circle mr-1' />
                  Senha inicial: <strong>nodus@123</strong> — o atleta pode alterar no primeiro acesso.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className='flex justify-between px-6 py-4'
          style={{ borderTop: '1px solid var(--mui-palette-divider)' }}
        >
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className='rounded-lg px-4 py-2 text-sm transition-colors hover:bg-[var(--mui-palette-action-hover)]'
            style={{ border: '1px solid var(--mui-palette-divider)', color: 'var(--mui-palette-text-primary)' }}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          {step === 1 ? (
            <button
              onClick={() => {
                if (!form.name || !form.email) { setError('Nome e email são obrigatórios'); return }
                setError(''); setStep(2)
              }}
              className='rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors'
              style={{ backgroundColor: 'var(--mui-palette-primary-main)' }}
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit} disabled={loading}
              className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60'
              style={{ backgroundColor: 'var(--mui-palette-primary-main)' }}
            >
              {loading && <i className='tabler-loader-2 animate-spin' />}
              {loading ? 'Salvando...' : 'Cadastrar Atleta'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helpers de input/label com variáveis MUI
function Label({ children }) {
  return (
    <label className='mb-1 block text-xs font-medium' style={{ color: 'var(--mui-palette-text-secondary)' }}>
      {children}
    </label>
  )
}
function Input({ ...props }) {
  return (
    <input
      {...props}
      className='w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
      style={{
        backgroundColor: 'var(--mui-palette-action-hover)',
        border: '1px solid var(--mui-palette-divider)',
        color: 'var(--mui-palette-text-primary)',
      }}
    />
  )
}
function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className='w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
      style={{
        backgroundColor: 'var(--mui-palette-action-hover)',
        border: '1px solid var(--mui-palette-divider)',
        color: 'var(--mui-palette-text-primary)',
      }}
    >
      {children}
    </select>
  )
}
