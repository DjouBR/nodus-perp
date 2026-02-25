'use client'

// NextAuth SessionProvider
import { SessionProvider } from 'next-auth/react'

// Providers wrapper — deve ser Client Component
// Envolve toda a app com SessionProvider para que
// useSession() funcione em qualquer componente filho
const Providers = ({ children, session }) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

export default Providers
