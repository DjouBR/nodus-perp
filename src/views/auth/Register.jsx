'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'

import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import { useImageVariant } from '@core/hooks/useImageVariant'

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const RegisterView = ({ mode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState(null)

  const router = useRouter()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'athlete', terms: false }
  })

  const onSubmit = async data => {
    if (!data.terms) {
      setErrorState('Você precisa aceitar os termos de uso.')
      return
    }
    setLoading(true)
    // TODO: chamar API de registro
    // Por ora redireciona para verify-email
    setTimeout(() => {
      setLoading(false)
      router.push('/verify-email')
    }, 1200)
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault'>
        <div className='flex flex-col items-center gap-4 p-12 text-center'>
          <svg width='100' height='100' viewBox='0 0 120 120' fill='none'>
            <circle cx='60' cy='60' r='60' fill='var(--mui-palette-primary-main)' opacity='0.1' />
            <circle cx='60' cy='60' r='30' fill='var(--mui-palette-primary-main)' />
            <path d='M30 60 L42 60 L48 45 L54 75 L60 55 L66 65 L72 60 L90 60' stroke='white' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round' fill='none' />
          </svg>
          <Typography variant='h4' className='font-bold text-primary'>Junte-se ao NODUS</Typography>
          <Typography color='textSecondary' className='max-w-xs'>
            Comece sua jornada de treinamento inteligente com monitoramento cardíaco em tempo real.
          </Typography>
        </div>
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>

      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-5 is-full sm:max-is-[400px] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' className='font-bold'>Criar Conta</Typography>
            <Typography color='textSecondary'>Preencha seus dados para começar</Typography>
          </div>

          {errorState && <Alert severity='error' onClose={() => setErrorState(null)}>{errorState}</Alert>}

          <form noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            <Controller name='name' control={control} rules={{ required: 'Nome obrigatório' }}
              render={({ field }) => (
                <CustomTextField {...field} fullWidth label='Nome Completo' placeholder='Seu nome'
                  {...(errors.name && { error: true, helperText: errors.name.message })} />
              )}
            />
            <Controller name='email' control={control} rules={{ required: 'E-mail obrigatório' }}
              render={({ field }) => (
                <CustomTextField {...field} fullWidth type='email' label='E-mail' placeholder='seu@email.com'
                  {...(errors.email && { error: true, helperText: errors.email.message })} />
              )}
            />
            <Controller name='password' control={control} rules={{ required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
              render={({ field }) => (
                <CustomTextField {...field} fullWidth label='Senha' placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  slotProps={{ input: { endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={() => setIsPasswordShown(s => !s)} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )}}}
                  {...(errors.password && { error: true, helperText: errors.password.message })} />
              )}
            />
            <Controller name='role' control={control}
              render={({ field }) => (
                <CustomTextField {...field} select fullWidth label='Tipo de Conta'>
                  <MenuItem value='athlete'>Atleta / Aluno</MenuItem>
                  <MenuItem value='coach'>Coach / Professor</MenuItem>
                  <MenuItem value='tenant_admin'>Academia (Gestor)</MenuItem>
                </CustomTextField>
              )}
            />
            <Controller name='terms' control={control} rules={{ required: true }}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={
                    <Typography variant='body2'>
                      Concordo com os{' '}
                      <Typography component={Link} href='#' color='primary.main' variant='body2'>Termos de Uso</Typography>
                      {' '}e{' '}
                      <Typography component={Link} href='#' color='primary.main' variant='body2'>Política de Privacidade</Typography>
                    </Typography>
                  }
                />
              )}
            />
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className='flex justify-center items-center gap-2'>
              <Typography color='textSecondary'>Já tem conta?</Typography>
              <Typography component={Link} href='/login' color='primary.main'>Entrar</Typography>
            </div>

            <Divider className='gap-2'>ou registre-se com</Divider>
            <div className='flex gap-3'>
              <Button variant='outlined' color='secondary' startIcon={<i className='tabler-brand-google' />}
                onClick={() => signIn('google', { callbackUrl: '/home' })} className='flex-1'>
                Google
              </Button>
              <Button variant='outlined' color='secondary' startIcon={<i className='tabler-brand-facebook' />}
                onClick={() => signIn('facebook', { callbackUrl: '/home' })} className='flex-1'>
                Facebook
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterView
