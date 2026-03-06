'use client'

import { useState } from 'react'

const STEPS = ['Dados Pessoais', 'Tipo de Cliente']

export default function ClientAddModal({ onClose, onSuccess }) {
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    name: '', email: '', phone: '', document: '', birthdate: '', gender: '',
    role: 'tenant_admin', password: '',
    // tenant_admin
    tenant_name: '', tenant_type: 'academy',
    // coach
    cref: '', specialties: '', bio: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email) { setError('Nome e email são obrigatórios.'); return }
    if (form.role === 'tenant_admin' && !form.tenant_name) { setError('Nome da Academia/Tenant é obrigatório.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao cadastrar.'); return }
      onSuccess()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-lg rounded-2xl shadow-2xl'
        style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b p-5'
          style={{ borderColor: 'var(--mui-palette-divider)' }}
        >
          <div>
            <h2 className='text-lg font-semibold'>Novo Cliente</h2>
            <p className='text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }}>Passo {step + 1} de {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className='rounded-lg p-2 hover:bg-action-hover'>
            <i className='tabler-x text-xl' />
          </button>
        </div>

        {/* Steps indicator */}
        <div className='flex gap-1 px-5 pt-4'>
          {STEPS.map((s, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-action-selected'
            }`} />
          ))}
        </div>

        {/* Body */}
        <div className='p-5'>
          {error && (
            <div className='mb-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error'>{error}</div>
          )}

          {/* STEP 0 — Dados Pessoais */}
          {step === 0 && (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {[
                ['Nome completo*', 'name',  'text'],
                ['Email*',         'email', 'email'],
                ['Telefone',       'phone', 'text'],
                ['Documento (CPF/CNPJ)', 'document', 'text'],
              ].map(([lbl, key, type]) => (
                <div key={key}>
                  <label className='mb-1 block text-xs font-medium'>{lbl}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
                </div>
              ))}
              <div>
                <label className='mb-1 block text-xs font-medium'>Nascimento</label>
                <input type='date' value={form.birthdate} onChange={e => set('birthdate', e.target.value)}
                  className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium'>Gênero</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}
                  className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'>
                  <option value=''>Não informado</option>
                  <option value='M'>Masculino</option>
                  <option value='F'>Feminino</option>
                  <option value='other'>Outro</option>
                </select>
              </div>
              <div className='sm:col-span-2'>
                <label className='mb-1 block text-xs font-medium'>Senha inicial (padrão: nodus@123)</label>
                <input type='password' value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder='Deixe vazio para usar nodus@123'
                  className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
              </div>
            </div>
          )}

          {/* STEP 1 — Tipo de Cliente */}
          {step === 1 && (
            <div className='flex flex-col gap-4'>
              {/* Selector de tipo */}
              <div className='grid grid-cols-3 gap-2'>
                {[
                  ['tenant_admin', 'tabler-building-community', 'Academia / Franquia'],
                  ['coach',        'tabler-user-star',          'Treinador Independente'],
                  ['athlete',      'tabler-user',               'Atleta Independente'],
                ].map(([val, icon, label]) => (
                  <button
                    key={val}
                    onClick={() => set('role', val)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${
                      form.role === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-action-hover'
                    }`}
                  >
                    <i className={`${icon} text-2xl`} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Campos extras por tipo */}
              {form.role === 'tenant_admin' && (
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div className='sm:col-span-2'>
                    <label className='mb-1 block text-xs font-medium'>Nome da Academia / Empresa*</label>
                    <input type='text' value={form.tenant_name} onChange={e => set('tenant_name', e.target.value)}
                      className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium'>Tipo de Tenant</label>
                    <select value={form.tenant_type} onChange={e => set('tenant_type', e.target.value)}
                      className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'>
                      <option value='academy'>Academia</option>
                      <option value='franchise'>Franquia</option>
                      <option value='trainer'>Equipe de Treino</option>
                    </select>
                  </div>
                </div>
              )}

              {form.role === 'coach' && (
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-xs font-medium'>CREF</label>
                    <input type='text' value={form.cref} onChange={e => set('cref', e.target.value)}
                      placeholder='Ex: 012345-G/SP'
                      className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium'>Especialidades</label>
                    <input type='text' value={form.specialties} onChange={e => set('specialties', e.target.value)}
                      placeholder='HIIT, CrossFit...'
                      className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
                  </div>
                  <div className='sm:col-span-2'>
                    <label className='mb-1 block text-xs font-medium'>Bio profissional</label>
                    <textarea rows={2} value={form.bio} onChange={e => set('bio', e.target.value)}
                      className='w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary' />
                  </div>
                </div>
              )}

              {form.role === 'athlete' && (
                <p className='rounded-xl bg-action-hover p-3 text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  <i className='tabler-info-circle mr-1' />
                  O atleta independente será cadastrado sem vínculo com academia ou treinador.
                  Ele poderá completar seu perfil esportivo após o primeiro acesso.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-between border-t p-5'
          style={{ borderColor: 'var(--mui-palette-divider)' }}
        >
          <button
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            className='rounded-lg border px-4 py-2 text-sm hover:bg-action-hover'
          >
            {step === 0 ? 'Cancelar' : '← Voltar'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                if (!form.name || !form.email) { setError('Preencha nome e email antes de continuar.'); return }
                setError('')
                setStep(s => s + 1)
              }}
              className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'
            >
              {saving && <i className='tabler-loader-2 animate-spin' />}
              Cadastrar Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
