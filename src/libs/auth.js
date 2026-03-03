// NextAuth Options — NODUS RBAC Auth
// Leitura de usuários direto do banco MySQL via Drizzle ORM

import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/index.js'
import { users } from '@/lib/db/schema/index.js'

// Todos os roles válidos do sistema NODUS
export const VALID_ROLES = [
  'super_admin',
  'tenant_admin',
  'coach',
  'academy_coach',
  'receptionist',
  'academy_athlete',
  'athlete',
  'pending_onboarding', // OAuth sem onboarding completo
]

export const authOptions = {
  providers: [
    // ── Email + Senha ─────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha',  type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (!user)            return null
          if (!user.is_active)  return null

          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) return null

          // Garante que o role é válido antes de emitir o token
          const role = VALID_ROLES.includes(user.role) ? user.role : 'pending_onboarding'

          return {
            id:        user.id,
            name:      user.name,
            email:     user.email,
            role,
            tenant_id: user.tenant_id ?? null,
            unit_id:   user.unit_id   ?? null,
            avatar:    user.avatar_url ?? null,
          }
        } catch (error) {
          console.error('[NextAuth] Erro ao autenticar:', error)
          return null
        }
      }
    }),

    // ── Google OAuth ──────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    }),

    // ── Facebook OAuth ───────────────────────────────────────
    FacebookProvider({
      clientId:     process.env.FACEBOOK_CLIENT_ID     ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? ''
    })
  ],

  // ── Callbacks: injeta role, tenant_id e unit_id no JWT e na session ────
  callbacks: {
    async jwt({ token, user, account }) {
      // Primeiro login: copia dados do objeto user para o token
      if (user) {
        token.id        = user.id
        token.role      = user.role
        token.tenant_id = user.tenant_id
        token.unit_id   = user.unit_id
        token.avatar    = user.avatar
      }
      // OAuth (Google/Facebook): role padrão até completar onboarding
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        token.role      = token.role      ?? 'pending_onboarding'
        token.tenant_id = token.tenant_id ?? null
        token.unit_id   = token.unit_id   ?? null
      }
      // Sanity check: garante que o role no token é sempre válido
      if (!VALID_ROLES.includes(token.role)) {
        token.role = 'pending_onboarding'
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id
        session.user.role      = token.role
        session.user.tenant_id = token.tenant_id
        session.user.unit_id   = token.unit_id
        session.user.avatar    = token.avatar
      }
      return session
    }
  },

  // ── Páginas customizadas ─────────────────────────────────────────
  pages: {
    signIn: '/login',
    error:  '/login'
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60  // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET
}
