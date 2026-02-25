// Component Imports
import RegisterView from '@views/auth/Register'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Criar Conta',
  description: 'Crie sua conta NODUS'
}

const RegisterPage = async () => {
  const mode = await getServerMode()
  return <RegisterView mode={mode} />
}

export default RegisterPage
