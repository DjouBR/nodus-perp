// Component Imports
import VerifyEmailView from '@views/auth/VerifyEmail'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Verificar E-mail',
  description: 'Verifique seu e-mail para ativar sua conta NODUS'
}

const VerifyEmailPage = async () => {
  const mode = await getServerMode()
  return <VerifyEmailView mode={mode} />
}

export default VerifyEmailPage
