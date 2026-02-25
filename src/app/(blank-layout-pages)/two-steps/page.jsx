// Component Imports
import TwoStepsView from '@views/auth/TwoSteps'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'NODUS — Verificação em Dois Passos',
  description: 'Confirme sua identidade com verificação em dois passos'
}

const TwoStepsPage = async () => {
  const mode = await getServerMode()
  return <TwoStepsView mode={mode} />
}

export default TwoStepsPage
