'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import { useImageVariant } from '@core/hooks/useImageVariant'
import Logo from '@components/layout/shared/Logo'

const MaskImg = styled('img')({ blockSize: 'auto', maxBlockSize: 355, inlineSize: '100%', position: 'absolute', insetBlockEnd: 0, zIndex: -1 })

const TwoStepsView = ({ mode }) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputs = useRef([])
  const router = useRouter()
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleSubmit = () => {
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('Digite o código completo de 6 dígitos.'); return }
    setLoading(true)
    setError(null)
    // TODO: verificar código via API
    setTimeout(() => { setLoading(false); router.push('/home') }, 1200)
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='hidden md:flex flex-1 items-center justify-center relative bg-backgroundDefault'>
        <div className='flex flex-col items-center gap-4 p-12 text-center'>
          <i className='tabler-shield-check text-primary' style={{ fontSize: 80 }} />
          <Typography variant='h5' className='font-bold'>Verificação em Dois Passos</Typography>
          <Typography color='textSecondary' className='max-w-xs'>Sua conta está protegida com autenticação de dois fatores.</Typography>
        </div>
        <MaskImg alt='mask' src={authBackground} />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'><Logo /></div>
        <div className='flex flex-col gap-6 items-center text-center is-full sm:max-is-[400px] mbs-8 sm:mbs-11 md:mbs-0'>
          <i className='tabler-device-mobile text-primary' style={{ fontSize: 56 }} />
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' className='font-bold'>Verificação em Dois Passos 🔐</Typography>
            <Typography color='textSecondary'>
              Insira o código de 6 dígitos enviado para o seu aplicativo autenticador ou SMS.
            </Typography>
          </div>
          {error && <Alert severity='error' className='w-full' onClose={() => setError(null)}>{error}</Alert>}
          <div className='flex gap-2 justify-center'>
            {code.map((digit, i) => (
              <TextField
                key={i}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                inputRef={el => inputs.current[i] = el}
                inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', width: 44, height: 44 } }}
                sx={{ width: 52 }}
              />
            ))}
          </div>
          <Button fullWidth variant='contained' onClick={handleSubmit} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar Código'}
          </Button>
          <Typography color='textSecondary' variant='body2'>
            Não recebeu o código?{' '}
            <Typography component='span' color='primary.main' className='cursor-pointer'>Reenviar</Typography>
          </Typography>
          <Typography component={Link} href='/login' color='primary.main' variant='body2'>
            <i className='tabler-chevron-left' /> Voltar para o login
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default TwoStepsView
