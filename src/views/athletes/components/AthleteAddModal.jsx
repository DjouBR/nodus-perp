'use client'

import { useState } from 'react'
import NodusToast from '@/components/NodusToast'

const STEPS = ['Dados Pessoais', 'Ficha Esportiva']

export default function AthleteAddModal({ onClose, onSuccess }) {
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState({ open: false, message: '', severity: 'success' })
  const [form, setForm]     = useState({
    name: '', email: '', phone: '', birthdate: '', document: '', gender: '',
    hr_max: '', hr_rest: '', weight_kg: '', height_cm: '', goal: '',
  })
  const [errors, setErrors] = useState({})

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity })

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validateStep0 = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Nome é obrigatório'
    if (!form.email.trim()) e.email = 'Email é obrigatório'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    // gender e birthdate: campos obrigatórios para evitar erro MySQL
    if (!form.gender)    e.gender    = 'Gênero é obrigatório'
    if (!form.birthdate) e.birthdate = 'Data de nascimento é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!validateStep0()) { setStep(0); return }
    setSaving(true)
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      showToast('Atleta cadastrado com sucesso!')
      setTimeout(() => onSuccess(), 1200)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (key) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary bg-background ${
      errors[key] ? 'border-error' : ''
    }`

  const LabelRequired = ({ children }) => (
    <label className='mb-1 block text-sm font-medium'>
      {children} <span className='text-error'>*</span>
    </label>
  )

  return (
    <>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
        <div className='w-full max-w-lg rounded-xl shadow-xl'
          style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>

          {/* Header */}
          <div className='flex items-center justify-between border-b p-5'
            style={{ borderColor: 'var(--mui-palette-divider)' }}>
            <div>
              <h2 className='text-lg font-semibold'>Novo Atleta</h2>
              <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                Passo {step + 1} de {STEPS.length} — {STEPS[step]}
              </p>
            </div>
            <button onClick={onClose} className='rounded p-1 hover:bg-action-hover'>
              <i className='tabler-x text-xl' />
            </button>
          </div>

          {/* Stepper */}
          <div className='flex gap-2 px-5 pt-4'>
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-action-hover'
              }`} />
            ))}
          </div>

          {/* Body */}
          <div className='p-5'>
            {step === 0 && (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='sm:col-span-2'>
                  <LabelRequired>Nome completo</LabelRequired>
                  <input type='text' value={form.name} onChange={e => set('name', e.target.value)}
                    className={inputCls('name')} placeholder='Ex: João Silva' />
                  {errors.name && <p className='mt-1 text-xs text-error'>{errors.name}</p>}
                </div>
                <div className='sm:col-span-2'>
                  <LabelRequired>Email</LabelRequired>
                  <input type='email' value={form.email} onChange={e => set('email', e.target.value)}
                    className={inputCls('email')} placeholder='joao@email.com' />
                  {errors.email && <p className='mt-1 text-xs text-error'>{errors.email}</p>}
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Telefone</label>
                  <input type='text' value={form.phone} onChange={e => set('phone', e.target.value)}
                    className={inputCls('phone')} placeholder='(11) 99999-9999' />
                </div>
                <div>
                  <LabelRequired>Data de Nascimento</LabelRequired>
                  <input type='date' value={form.birthdate} onChange={e => set('birthdate', e.target.value)}
                    className={inputCls('birthdate')} />
                  {errors.birthdate && <p className='mt-1 text-xs text-error'>{errors.birthdate}</p>}
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Documento (CPF)</label>
                  <input type='text' value={form.document} onChange={e => set('document', e.target.value)}
                    className={inputCls('document')} placeholder='000.000.000-00' />
                </div>
                <div>
                  <LabelRequired>Gênero</LabelRequired>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}
                    className={inputCls('gender')}>
                    <option value=''>Selecione...</option>
                    <option value='M'>Masculino</option>
                    <option value='F'>Feminino</option>
                    <option value='other'>Outro</option>
                  </select>
                  {errors.gender && <p className='mt-1 text-xs text-error'>{errors.gender}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>FC Máxima (bpm)</label>
                  <input type='number' value={form.hr_max} onChange={e => set('hr_max', e.target.value)}
                    className={inputCls('hr_max')} placeholder='Ex: 185' />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium'>FC Repouso (bpm)</label>
                  <input type='number' value={form.hr_rest} onChange={e => set('hr_rest', e.target.value)}
                    className={inputCls('hr_rest')} placeholder='Ex: 60' />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Peso (kg)</label>
                  <input type='text' value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                    className={inputCls('weight_kg')} placeholder='Ex: 75.5' />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Altura (cm)</label>
                  <input type='text' value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                    className={inputCls('height_cm')} placeholder='Ex: 175' />
                </div>
                <div className='sm:col-span-2'>
                  <label className='mb-1 block text-sm font-medium'>Objetivo</label>
                  <textarea rows={2} value={form.goal} onChange={e => set('goal', e.target.value)}
                    className={`${inputCls('goal')} resize-none`}
                    placeholder='Ex: Perda de peso, condicionamento para Hyrox...' />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-between border-t p-5'
            style={{ borderColor: 'var(--mui-palette-divider)' }}>
            <button
              onClick={step === 0 ? onClose : () => setStep(0)}
              className='rounded-lg border px-4 py-2 text-sm hover:bg-action-hover'
            >
              {step === 0 ? 'Cancelar' : '← Voltar'}
            </button>
            {step === 0 ? (
              <button onClick={handleNext}
                className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'>
                Próximo →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'>
                {saving && <i className='tabler-loader-2 animate-spin' />}
                Cadastrar Atleta
              </button>
            )}
          </div>
        </div>
      </div>

      <NodusToast open={toast.open} message={toast.message} severity={toast.severity}
        onClose={() => setToast(t => ({ ...t, open: false }))} />
    </>
  )
}
