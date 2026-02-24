// Component Imports
import Providers from '@components/Providers'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children } = props
  const direction = 'ltr'
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction} systemMode={systemMode}>
      {children}
    </Providers>
  )
}

export default Layout
