'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

const NotFound = () => {
  return (
    <div className='flex items-center justify-center min-h-screen flex-col gap-4'>
      <Typography variant='h1' className='font-bold text-8xl'>
        404
      </Typography>
      <Typography variant='h5'>Página não encontrada</Typography>
      <Typography variant='body2' color='textSecondary'>
        A página que você está procurando não existe.
      </Typography>
      <Button variant='contained' component={Link} href='/home'>
        Voltar ao Dashboard
      </Button>
    </div>
  )
}

export default NotFound
