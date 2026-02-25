'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import { useSettings } from '@core/hooks/useSettings'
import { useImageVariant } from '@core/hooks/useImageVariant'

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const LoginView = ({ mode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async data => {
    setLoading(true)
    setErrorState(null)

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false
    })

    setLoading(false)

    if (res?.ok && !res?.error) {
      const redirectTo = searchParams.get('redirectTo') ?? '/home'
      router.replace(redirectTo)
    } else {
      setErrorState('E-mail ou senha inválidos. Verifique suas credenciais.')
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      {/* Lado esquerdo — ilustração (apenas desktop) */}
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault min-h-screen'>
        <div className='flex flex-col items-center gap-6 p-12'>
          {/* Ícone NODUS grande */}
          <svg width='120' height='120' viewBox='0 0 120 120' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='60' cy='60' r='60' fill='var(--mui-palette-primary-main)' opacity='0.1' />
            <circle cx='60' cy='60' r='45' fill='var(--mui-palette-primary-main)' opacity='0.15' />
            <circle cx='60' cy='60' r='30' fill='var(--mui-palette-primary-main)' />
            {/* Heartbeat line */}
            <path
              d='M30 60 L42 60 L48 45 L54 75 L60 55 L66 65 L72 60 L90 60'
              stroke='white'
              strokeWidth='3.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
          </svg>
          <div className='text-center'>
            <Typography variant='h3' className='font-bold text-primary'>NODUS</Typography>
            <Typography variant='body1' color='textSecondary' className='mt-2 max-w-xs'>
              Monitoramento cardíaco inteligente para academias, atletas e coaches.
            </Typography>
          </div>
          <div className='flex flex-col gap-3 mt-4'>
            {[
              { icon: 'tabler-heart-rate-monitor', text: 'FC em tempo real via ANT+ e Bluetooth' },
              { icon: 'tabler-chart-bar', text: 'TRIMP, ACWR e zonas de treinamento' },
              { icon: 'tabler-users', text: 'Gestão multi-tenant para redes de academias' }
            ].map(item => (
              <div key={item.text} className='flex items-center gap-3'>
                <i className={`${item.icon} text-primary text-xl`} />
                <Typography variant='body2' color='textSecondary'>{item.text}</Typography>
              </div>
            ))}
          </div>
        </div>
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>

      {/* Lado direito — formulário */}
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' className='font-bold'>
              Bem-vindo ao NODUS! 👋
            </Typography>
            <Typography color='textSecondary'>
              Acesse sua conta para continuar
            </Typography>
          </div>

          {errorState && (
            <Alert severity='error' onClose={() => setErrorState(null)}>
              {errorState}
            </Alert>
          )}

          {/* Credenciais de teste */}
          <Alert icon={false} className='bg-[var(--mui-palette-primary-lightOpacity)]'>
            <Typography variant='caption' color='primary.main' className='block font-semibold mb-1'>Contas de teste:</Typography>
            <Typography variant='caption' color='primary.main' className='block'>admin@nodus.app / admin123 (Super Admin)</Typography>
            <Typography variant='caption' color='primary.main' className='block'>academia@nodus.app / academia123 (Academia)</Typography>
            <Typography variant='caption' color='primary.main' className='block'>coach@nodus.app / coach123 (Coach)</Typography>
            <Typography variant='caption' color='primary.main' className='block'>atleta@nodus.app / atleta123 (Atleta)</Typography>
          </Alert>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='email'
              control={control}
              rules={{ required: 'E-mail obrigatório' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  type='email'
                  label='E-mail'
                  placeholder='seu@email.com'
                  onChange={e => { field.onChange(e.target.value); setErrorState(null) }}
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              rules={{ required: 'Senha obrigatória' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Senha'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={e => { field.onChange(e.target.value); setErrorState(null) }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={() => setIsPasswordShown(s => !s)} onMouseDown={e => e.preventDefault()}>
                            <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />

            <div className='flex justify-between items-center flex-wrap gap-2'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Lembrar de mim' />
              <Typography component={Link} href='/forgot-password' color='primary.main' className='text-sm'>
                Esqueceu a senha?
              </Typography>
            </div>

            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography color='textSecondary'>Novo no NODUS?</Typography>
              <Typography component={Link} href='/register' color='primary.main'>
                Criar conta
              </Typography>
            </div>

            <Divider className='gap-2'>ou entre com</Divider>

            <div className='flex gap-3 justify-center'>
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<i className='tabler-brand-google text-lg' />}
                onClick={() => signIn('google', { callbackUrl: '/home' })}
                className='flex-1'
              >
                Google
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<i className='tabler-brand-facebook text-lg' />}
                onClick={() => signIn('facebook', { callbackUrl: '/home' })}
                className='flex-1'
              >
                Facebook
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginView
