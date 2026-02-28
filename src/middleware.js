// NODUS — Middleware de Proteção de Rotas com RBAC
// LGPD: super_admin acessa apenas dados operacionais/agregados do seu escopo.
// Dados pessoais de atletas, coaches e recepcionistas são isolados por tenant.
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/two-steps'
]

const ALL_ROLES = ['super_admin', 'tenant_admin', 'coach', 'athlete', 'receptionist']

const ROUTE_PERMISSIONS = {
  // ── Super Admin — escopo: gestão do SaaS, sem dados pessoais de atletas ──
  '/admin':              ['super_admin'],
  // Nota: super_admin usa /admin/tenants para ver dados operacionais dos tenants
  // e NUNCA acessa /academy/settings, /coach/settings etc. diretamente.

  // ── Tenant Admin ─────────────────────────────────────────────
  '/academies':          ['super_admin', 'tenant_admin'],
  '/coaches':            ['super_admin', 'tenant_admin'],

  // ── Coach + Tenant Admin ─────────────────────────────────────
  '/reports':            ['tenant_admin', 'coach'],
  '/planning':           ['tenant_admin', 'coach'],
  '/sessions':           ['tenant_admin', 'coach'],
  '/monitoring':         ['tenant_admin', 'coach', 'athlete'],

  // ── Operacional ─────────────────────────────────────────────
  '/athletes':           ['tenant_admin', 'coach', 'receptionist'],

  // ── Settings isolados por role (sem cross-access) ─────────────────
  // super_admin gerencia OUTROS tenants via /admin — não via settings deles
  '/admin/settings':        ['super_admin'],
  '/academy/settings':      ['tenant_admin'],
  '/coach/settings':        ['coach'],
  '/athlete/settings':      ['athlete'],
  '/receptionist/settings': ['receptionist'],

  // ── Todos os autenticados ─────────────────────────────────────
  '/home':               ALL_ROLES,
  '/profile':            ALL_ROLES,
  '/daily-logs':         ['tenant_admin', 'coach', 'athlete'],
}

export const getHomeByRole = role => {
  const homes = {
    super_admin:          '/admin/dashboard',
    tenant_admin:         '/home',
    coach:                '/home',
    athlete:              '/home',
    receptionist:         '/home',
    pending_onboarding:   '/onboarding'
  }
  return homes[role] ?? '/home'
}

export const getSettingsByRole = role => {
  const map = {
    super_admin:   '/admin/settings',
    tenant_admin:  '/academy/settings',
    coach:         '/coach/settings',
    athlete:       '/athlete/settings',
    receptionist:  '/receptionist/settings',
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
