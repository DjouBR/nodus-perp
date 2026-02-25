'use client'

import Link from 'next/link'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useImageVariant } from '@core/hooks/useImageVariant'
import Logo from '@components/layout/shared/Logo'

const MaskImg = styled('img')({ blockSize: 'auto', maxBlockSize: 355, inlineSize: '100%', position: 'absolute', insetBlockEnd: 0, zIndex: -1 })

const VerifyEmailView = ({ mode }) => {
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  return (
    <div className='flex bs-full justify-center'>
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault'>
        <div className='flex flex-col items-center gap-4 p-12 text-center'>
          <i className='tabler-mail text-primary' style={{ fontSize: 80 }} />
          <Typography variant='h5' className='font-bold'>Verifique seu e-mail</Typography>
          <Typography color='textSecondary' className='max-w-xs'>Um link de confirmação foi enviado para o seu endereço de e-mail.</Typography>
        </div>
        <MaskImg alt='mask' src={authBackground} />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'><Logo /></div>
        <div className='flex flex-col gap-6 items-center text-center is-full sm:max-is-[400px] mbs-8 sm:mbs-11 md:mbs-0'>
          <i className='tabler-mail-check text-primary' style={{ fontSize: 60 }} />
          <div className='flex flex-col gap-2'>
            <Typography variant='h4' className='font-bold'>Verifique seu e-mail ✉️</Typography>
            <Typography color='textSecondary'>
              Enviamos um link de confirmação para o seu e-mail. Por favor, acesse sua caixa de entrada e clique no link para ativar sua conta.
            </Typography>
          </div>
          <Button fullWidth variant='contained' component={Link} href='/login'>
            Ir para o Login
          </Button>
          <Typography color='textSecondary' variant='body2'>
            Não recebeu o e-mail?{' '}
            <Typography component='span' color='primary.main' className='cursor-pointer' onClick={() => {}}>
              Reenviar
            </Typography>
          </Typography>
          <Typography component={Link} href='/login' color='primary.main' variant='body2'>
            <i className='tabler-chevron-left' /> Voltar para o login
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailView
