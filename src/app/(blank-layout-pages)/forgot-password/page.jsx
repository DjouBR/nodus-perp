// Component Imports
import ForgotPasswordView from '@views/auth/ForgotPassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Esqueceu a Senha',
  description: 'Recupere o acesso à sua conta NODUS'
}

const ForgotPasswordPage = async () => {
  const mode = await getServerMode()
  return <ForgotPasswordView mode={mode} />
}

export default ForgotPasswordPage
