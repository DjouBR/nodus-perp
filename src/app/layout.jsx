// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'NODUS - Monitoramento Cardíaco Inteligente',
  description:
    'NODUS - SaaS PWA para monitoramento cardíaco em tempo real, gestão de atletas, academias e coaches.'
}

const RootLayout = async props => {
  const { children } = props
  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='pt-BR' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
