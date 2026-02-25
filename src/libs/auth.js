// NextAuth Options — NODUS RBAC Auth
// Suporta: credentials (email+senha), Google OAuth, Facebook OAuth

import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'

export const authOptions = {
  providers: [
    // ─── Email + Senha ───────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        // TODO: substituir por query real ao banco de dados
        // Exemplo de usuários de teste para desenvolvimento
        const users = [
          {
            id: '1',
            name: 'Super Admin',
            email: 'admin@nodus.app',
            password: 'admin123',
            role: 'super_admin',
            tenant_id: null,
            unit_id: null
          },
          {
            id: '2',
            name: 'Academia Teste',
            email: 'academia@nodus.app',
            password: 'academia123',
            role: 'tenant_admin',
            tenant_id: 'tenant-001',
            unit_id: 'unit-001'
          },
          {
            id: '3',
            name: 'Coach Teste',
            email: 'coach@nodus.app',
            password: 'coach123',
            role: 'coach',
            tenant_id: 'tenant-001',
            unit_id: 'unit-001'
          },
          {
            id: '4',
            name: 'Atleta Teste',
            email: 'atleta@nodus.app',
            password: 'atleta123',
            role: 'athlete',
            tenant_id: 'tenant-001',
            unit_id: 'unit-001'
          },
          {
            id: '5',
            name: 'Recepcionista Teste',
            email: 'recepcao@nodus.app',
            password: 'recepcao123',
            role: 'receptionist',
            tenant_id: 'tenant-001',
            unit_id: 'unit-001'
          }
        ]

        const user = users.find(
          u => u.email === credentials.email && u.password === credentials.password
        )

        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          unit_id: user.unit_id
        }
      }
    }),

    // ─── Google OAuth ─────────────────────────────────────────────────────
    // Requer: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    }),

    // ─── Facebook OAuth ───────────────────────────────────────────────────
    // Requer: FACEBOOK_CLIENT_ID e FACEBOOK_CLIENT_SECRET no .env
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? ''
    })
  ],

  // ─── Callbacks: injeta role e tenant_id no JWT e na session ──────────
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.tenant_id = user.tenant_id
        token.unit_id = user.unit_id
        token.id = user.id
      }
      // Para OAuth (Google/Facebook), role padrão até completar onboarding
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        token.role = token.role ?? 'pending_onboarding'
        token.tenant_id = token.tenant_id ?? null
        token.unit_id = token.unit_id ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tenant_id = token.tenant_id
        session.user.unit_id = token.unit_id
      }
      return session
    }
  },

  // ─── Páginas customizadas ─────────────────────────────────────────────
  pages: {
    signIn: '/login',
    error: '/login'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET
}
