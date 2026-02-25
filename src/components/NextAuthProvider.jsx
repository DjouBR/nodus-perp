'use client'

// SessionProvider precisa ser Client Component
import { SessionProvider } from 'next-auth/react'

const NextAuthProvider = ({ children }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

export default NextAuthProvider
