'use client'

import { useState } from 'react'
import Link from 'next/link'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import { Controller, useForm } from 'react-hook-form'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import { useImageVariant } from '@core/hooks/useImageVariant'

const MaskImg = styled('img')({ blockSize: 'auto', maxBlockSize: 355, inlineSize: '100%', position: 'absolute', insetBlockEnd: 0, zIndex: -1 })

const ForgotPasswordView = ({ mode }) => {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async data => {
    setLoading(true)
    // TODO: chamar API de reset de senha
    setTimeout(() => { setLoading(false); setSent(true) }, 1200)
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault'>
        <div className='flex flex-col items-center gap-4 p-12 text-center'>
          <i className='tabler-lock-open text-primary' style={{ fontSize: 80 }} />
          <Typography variant='h5' className='font-bold'>Recuperar Acesso</Typography>
          <Typography color='textSecondary' className='max-w-xs'>Insira seu e-mail e enviaremos um link para redefinir sua senha.</Typography>
        </div>
        <MaskImg alt='mask' src={authBackground} />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'><Logo /></div>
        <div className='flex flex-col gap-6 is-full sm:max-is-[400px] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' className='font-bold'>Esqueceu a senha? 🔒</Typography>
            <Typography color='textSecondary'>Digite seu e-mail e enviaremos as instruções</Typography>
          </div>
          {sent ? (
            <Alert severity='success'>E-mail enviado! Verifique sua caixa de entrada.</Alert>
          ) : (
            <form noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
              <Controller name='email' control={control} rules={{ required: 'E-mail obrigatório' }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth type='email' label='E-mail' placeholder='seu@email.com'
                    {...(errors.email && { error: true, helperText: errors.email.message })} />
                )}
              />
              <Button fullWidth variant='contained' type='submit' disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
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

export default ForgotPasswordView
