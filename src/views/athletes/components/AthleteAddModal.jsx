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
  const [step, setStep]       = useState(1)  // 1 = dados pessoais | 2 = dados esportivos

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao criar atleta'); return }
      onSuccess()
    } catch (e) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-lg rounded-2xl bg-cardColor shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold'>Novo Atleta</h2>
            <p className='text-xs text-textSecondary'>Passo {step} de 2</p>
          </div>
          <button onClick={onClose} className='rounded-lg p-1.5 hover:bg-actionHover'>
            <i className='tabler-x text-xl' />
          </button>
        </div>

        {/* Steps indicator */}
        <div className='flex gap-1 px-6 pt-4'>
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-border'
            }`} />
          ))}
        </div>

        {/* Body */}
        <div className='space-y-4 px-6 py-4'>
          {error && (
            <div className='flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-sm text-error'>
              <i className='tabler-alert-circle' />{error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Nome completo *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className='input w-full' placeholder='Ex: Ana Paula Souza' />
                </div>
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Email *</label>
                  <input type='email' value={form.email} onChange={e => set('email', e.target.value)}
                    className='input w-full' placeholder='atleta@email.com' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Telefone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    className='input w-full' placeholder='(19) 99999-0000' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Gênero</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className='input w-full'>
                    <option value=''>Selecionar</option>
                    <option value='M'>Masculino</option>
                    <option value='F'>Feminino</option>
                    <option value='other'>Outro</option>
                  </select>
                </div>
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Data de nascimento</label>
                  <input type='date' value={form.birthdate} onChange={e => set('birthdate', e.target.value)}
                    className='input w-full' />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>FC Máxima (bpm)</label>
                  <input type='number' value={form.hr_max} onChange={e => set('hr_max', e.target.value)}
                    className='input w-full' placeholder='Ex: 190' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>FC Repouso (bpm)</label>
                  <input type='number' value={form.hr_rest} onChange={e => set('hr_rest', e.target.value)}
                    className='input w-full' placeholder='Ex: 60' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Peso (kg)</label>
                  <input type='number' value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                    className='input w-full' placeholder='Ex: 75' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Altura (cm)</label>
                  <input type='number' value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                    className='input w-full' placeholder='Ex: 175' />
                </div>
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Objetivo</label>
                  <textarea value={form.goal} onChange={e => set('goal', e.target.value)}
                    rows={2} className='input w-full resize-none' placeholder='Ex: Perda de peso, condicionamento...' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Contato emergência</label>
                  <input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)}
                    className='input w-full' placeholder='Nome' />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-textSecondary'>Tel. emergência</label>
                  <input value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)}
                    className='input w-full' placeholder='(19) 99999-0000' />
                </div>
              </div>
              <p className='text-xs text-textSecondary'>
                <i className='tabler-info-circle mr-1' />
                Senha inicial: <strong>nodus@123</strong> — o atleta pode alterar no primeiro acesso.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-between border-t border-border px-6 py-4'>
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className='rounded-lg border border-border px-4 py-2 text-sm hover:bg-actionHover'
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          {step === 1 ? (
            <button
              onClick={() => { if (!form.name || !form.email) { setError('Nome e email são obrigatórios'); return }; setError(''); setStep(2) }}
              className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'
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
