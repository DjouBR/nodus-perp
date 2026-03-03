// NODUS — Middleware de Proteção de Rotas com RBAC
// LGPD: super_admin acessa apenas dados operacionais/agregados do seu escopo.
// Dados pessoais de atletas, coaches e recepcionistas são isolados por tenant.
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/two-steps'
]

const ALL_ROLES = [
  'super_admin',
  'tenant_admin',
  'coach',
  'academy_coach',
  'receptionist',
  'academy_athlete',
  'athlete',
]

const ROUTE_PERMISSIONS = {

  // ── SUPER ADMIN ───────────────────────────────────────────────
  // Escopo exclusivo: gestão do SaaS, sem dados pessoais de usuários finais
  '/admin':                       ['super_admin'],

  // ── ACADEMIA / EQUIPES (tenant_admin) ────────────────────────
  '/academy':                     ['tenant_admin'],

  // ── COACH INDEPENDENTE ─────────────────────────────────
  '/coach':                       ['coach'],

  // ── TREINADOR DA ACADEMIA (academy_coach) ─────────────────
  '/academy_coach':               ['academy_coach'],

  // ── RECEPCIONISTA ────────────────────────────────────
  '/recepcionist':                ['receptionist'],

  // ── ALUNO DA ACADEMIA (academy_athlete) ──────────────────
  '/academy_athlete':             ['academy_athlete'],

  // ── ATLETA INDEPENDENTE ───────────────────────────────
  '/athlete':                     ['athlete'],

  // ── ROTAS GLOBAIS (todos os autenticados) ─────────────────
  '/home':                        ALL_ROLES,
  '/profile':                     ALL_ROLES,
}

// Rota de destino após login por role
export const getHomeByRole = role => {
  const homes = {
    super_admin:        '/home',
    tenant_admin:       '/home',
    coach:              '/home',
    academy_coach:      '/home',
    receptionist:       '/home',
    academy_athlete:    '/home',
    athlete:            '/home',
    pending_onboarding: '/onboarding',
  }
  return homes[role] ?? '/home'
}

// Rota de configurações por role
export const getSettingsByRole = role => {
  const map = {
    super_admin:     '/admin/settings',
    tenant_admin:    '/academy/config',
    coach:           '/coach/config',
    academy_coach:   '/academy_coach/config',
    receptionist:    '/recepcionist/config',
    academy_athlete: '/academy_athlete/config',
    athlete:         '/athlete/config',
  }
  return map[role] ?? '/profile'
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token
    const role = token?.role

    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
      pathname.startsWith(route)
    )

    if (matchedRoute) {
      const allowedRoles = ROUTE_PERMISSIONS[matchedRoute]
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(getHomeByRole(role), req.url))
      }
    }

    return NextResponse.next()
  },
  { callbacks: { authorized: () => true } }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|images|assets).*)']
}
