// NODUS — Middleware de Proteção de Rotas com RBAC (8 roles)
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Rotas completamente públicas (sem autenticação)
const PUBLIC_ROUTES = [
  '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/two-steps',
  // Tela 2 — Monitor público para TV/SmartTV (acesso via token de sessão)
  '/monitor',
]

const ALL_ROLES = [
  'super_admin', 'tenant_admin', 'coach', 'academy_coach',
  'receptionist', 'academy_athlete', 'coach_athlete', 'athlete',
]

const STAFF_ROLES   = ['super_admin', 'tenant_admin', 'coach', 'academy_coach', 'receptionist']
const COACH_ROLES   = ['tenant_admin', 'coach', 'academy_coach']
const ATHLETE_ROLES = ['academy_athlete', 'coach_athlete', 'athlete']

const ROUTE_PERMISSIONS = [
  // ── Rotas exclusivas por role ────────────────────────────────
  ['/academy_athlete',  ['academy_athlete']],
  ['/coach_athlete',    ['coach_athlete']],
  ['/academy_coach',    ['academy_coach']],
  ['/admin',            ['super_admin']],
  ['/academy',          ['tenant_admin']],
  ['/coach',            ['coach']],
  ['/recepcionist',     ['receptionist']],
  ['/athlete',          ['athlete']],

  // ── Rotas compartilhadas ─────────────────────────────────
  ['/academies',        ['super_admin', 'tenant_admin']],
  ['/coaches',          ['super_admin', 'tenant_admin']],
  ['/athletes',         ['tenant_admin', 'academy_coach', 'receptionist']],
  ['/monitoring',       [...COACH_ROLES, ...ATHLETE_ROLES]],
  ['/planning',         COACH_ROLES],

  // sessions: staff gerencia, atletas visualizam as próprias sessões
  ['/sessions',         [...COACH_ROLES, 'receptionist', ...ATHLETE_ROLES]],

  ['/reports',          STAFF_ROLES],
  ['/settings',         ALL_ROLES],
  ['/receptionist',     ['receptionist']],
  ['/daily-logs',       [...COACH_ROLES, ...ATHLETE_ROLES]],

  // ── Rotas globais ─────────────────────────────────────
  ['/home',             ALL_ROLES],
  ['/profile',          ALL_ROLES],
]

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
    pending_onboarding: '/home',
  }
  return homes[role] ?? '/home'
}

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

    // Rotas públicas — sem autenticação
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const matched = ROUTE_PERMISSIONS
      .filter(([route]) => pathname.startsWith(route))
      .sort((a, b) => b[0].length - a[0].length)[0]

    if (matched) {
      const [, allowedRoles] = matched
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
