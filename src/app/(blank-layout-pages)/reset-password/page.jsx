// Component Imports
import ResetPasswordView from '@views/auth/ResetPassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Redefinir Senha',
  description: 'Redefina sua senha NODUS'
}

const ResetPasswordPage = async () => {
  const mode = await getServerMode()
  return <ResetPasswordView mode={mode} />
}

export default ResetPasswordPage
