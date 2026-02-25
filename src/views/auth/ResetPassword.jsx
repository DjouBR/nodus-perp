'use client'

import { useState } from 'react'
import Link from 'next/link'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import { Controller, useForm } from 'react-hook-form'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import { useImageVariant } from '@core/hooks/useImageVariant'

const MaskImg = styled('img')({ blockSize: 'auto', maxBlockSize: 355, inlineSize: '100%', position: 'absolute', insetBlockEnd: 0, zIndex: -1 })

const ResetPasswordView = ({ mode }) => {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const { control, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { password: '', confirm: '' } })

  const onSubmit = async data => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setSuccess(true) }, 1200)
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault'>
        <div className='flex flex-col items-center gap-4 p-12 text-center'>
          <i className='tabler-lock text-primary' style={{ fontSize: 80 }} />
          <Typography variant='h5' className='font-bold'>Redefinir Senha</Typography>
          <Typography color='textSecondary' className='max-w-xs'>Crie uma nova senha segura para sua conta NODUS.</Typography>
        </div>
        <MaskImg alt='mask' src={authBackground} />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'><Logo /></div>
        <div className='flex flex-col gap-6 is-full sm:max-is-[400px] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' className='font-bold'>Nova Senha 🔑</Typography>
            <Typography color='textSecondary'>A senha deve ter no mínimo 8 caracteres</Typography>
          </div>
          {success ? (
            <><Alert severity='success'>Senha redefinida com sucesso!</Alert>
            <Button fullWidth variant='contained' component={Link} href='/login'>Ir para o login</Button></>
          ) : (
            <form noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
              {[['password', 'Nova Senha', showPass, setShowPass], ['confirm', 'Confirmar Senha', showConfirm, setShowConfirm]].map(([name, label, show, setShow]) => (
                <Controller key={name} name={name} control={control}
                  rules={{ required: 'Campo obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    validate: name === 'confirm' ? v => v === watch('password') || 'As senhas não coincidem' : undefined }}
                  render={({ field }) => (
                    <CustomTextField {...field} fullWidth label={label} placeholder='············'
                      type={show ? 'text' : 'password'}
                      slotProps={{ input: { endAdornment: (<InputAdornment position='end'><IconButton edge='end' onClick={() => setShow(s => !s)} onMouseDown={e => e.preventDefault()}><i className={show ? 'tabler-eye' : 'tabler-eye-off'} /></IconButton></InputAdornment>) }}}
                      {...(errors[name] && { error: true, helperText: errors[name].message })} />
                  )}
                />
              ))}
              <Button fullWidth variant='contained' type='submit' disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </Button>
            </form>
          )}
          <Typography className='text-center' component={Link} href='/login' color='primary.main'>
            <i className='tabler-chevron-left' /> Voltar para o login
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordView
