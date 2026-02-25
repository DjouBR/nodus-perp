// Component Imports
import LoginView from '@views/auth/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Login',
  description: 'Acesse sua conta NODUS'
}

const LoginPage = async () => {
  const mode = await getServerMode()
  return <LoginView mode={mode} />
}

export default LoginPage
