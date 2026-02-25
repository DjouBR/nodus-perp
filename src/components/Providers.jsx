// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

// NextAuth Provider (Client Component separado)
import NextAuthProvider from '@components/NextAuthProvider'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

// Providers — Server Component (async)
// Mantém SettingsProvider, ThemeProvider e VerticalNavProvider do template
// + envolve com NextAuthProvider (Client Component) para useSession()
const Providers = async props => {
  const { children, direction } = props

  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <NextAuthProvider>
      <VerticalNavProvider>
        <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
          <ThemeProvider direction={direction} systemMode={systemMode}>
            {children}
          </ThemeProvider>
        </SettingsProvider>
      </VerticalNavProvider>
    </NextAuthProvider>
  )
}

export default Providers
