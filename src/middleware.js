// NODUS — Middleware de Proteção de Rotas com RBAC (8 roles)
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
  'coach_athlete',
  'athlete',
]

const STAFF_ROLES   = ['super_admin', 'tenant_admin', 'coach', 'academy_coach', 'receptionist']
const COACH_ROLES   = ['tenant_admin', 'coach', 'academy_coach']
const ATHLETE_ROLES = ['academy_athlete', 'coach_athlete', 'athlete']

const ROUTE_PERMISSIONS = {

  // ──────────────────────────────────────────────────
  // ROTAS EXCLUSIVAS POR ROLE (prefixo = role)
  // ──────────────────────────────────────────────────
  '/admin':            ['super_admin'],
  '/academy':          ['tenant_admin'],
  '/coach':            ['coach'],
  '/academy_coach':    ['academy_coach'],
  '/recepcionist':     ['receptionist'],
  '/academy_athlete':  ['academy_athlete'],
  '/coach_athlete':    ['coach_athlete'],    // rotas exclusivas do aluno do coach
  '/athlete':          ['athlete'],

  // ──────────────────────────────────────────────────
  // ROTAS COMPARTILHADAS
  // ──────────────────────────────────────────────────
  '/academies':        ['super_admin', 'tenant_admin'],
  '/coaches':          ['super_admin', 'tenant_admin'],
  '/athletes':         ['tenant_admin', 'coach', 'academy_coach', 'receptionist'],
  '/monitoring':       [...COACH_ROLES, ...ATHLETE_ROLES],
  '/planning':         COACH_ROLES,
  '/sessions':         [...COACH_ROLES, 'receptionist'],
  '/reports':          STAFF_ROLES,
  '/settings':         ALL_ROLES,
  '/receptionist':     ['receptionist'],
  '/daily-logs':       [...COACH_ROLES, ...ATHLETE_ROLES],

  // ──────────────────────────────────────────────────
  // ROTAS GLOBAIS (todos os autenticados)
  // ──────────────────────────────────────────────────
  '/home':             ALL_ROLES,
  '/profile':          ALL_ROLES,
  '/onboarding':       ['pending_onboarding'],
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
    coach_athlete:      '/home',
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
    coach_athlete:   '/coach_athlete/config',
    athlete:         '/athlete/config',
  }
  return map[role] ?? '/profile'
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token
    const role  = token?.role

    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    // Obtém a rota mais específica que bate com o pathname
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
      .filter(route => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0] // mais específica vence

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
