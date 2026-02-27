// NODUS — Middleware de Proteção de Rotas com RBAC
// Roda no Edge Runtime (Next.js middleware)

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// ─── Rotas públicas (não requerem autenticação) ───────────────────────────────
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/two-steps'
]

// ─── Permissões por rota: quais roles podem acessar ──────────────────────────
const ALL_ROLES = ['super_admin', 'tenant_admin', 'coach', 'athlete', 'receptionist']

const ROUTE_PERMISSIONS = {
  // Super Admin exclusivo
  '/admin': ['super_admin'],

  // Tenant Admin + super_admin
  '/academies': ['super_admin', 'tenant_admin'],
  '/coaches':   ['super_admin', 'tenant_admin'],

  // Tenant Admin + super_admin + coach
  '/reports':   ['super_admin', 'tenant_admin', 'coach'],
  '/planning':  ['super_admin', 'tenant_admin', 'coach'],
  '/sessions':  ['super_admin', 'tenant_admin', 'coach'],
  '/monitoring':['super_admin', 'tenant_admin', 'coach'],

  // Todos exceto athlete
  '/athletes':  ['super_admin', 'tenant_admin', 'coach', 'receptionist'],

  // Todos os autenticados
  '/home':       ALL_ROLES,
  '/daily-logs': ALL_ROLES,
  '/profile':    ALL_ROLES,   // ← qualquer role autenticado acessa
  '/settings':   ALL_ROLES,   // ← qualquer role autenticado acessa
}

// ─── Redirect pós-login por role ─────────────────────────────────────────────
export const getHomeByRole = role => {
  const homes = {
    super_admin:        '/admin/dashboard',
    tenant_admin:       '/home',
    coach:              '/home',
    athlete:            '/home',
    receptionist:       '/home',
    pending_onboarding: '/onboarding'
  }
  return homes[role] ?? '/home'
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token
    const role = token?.role

    // Rota pública — libera sem verificar
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.next()
    }

    // Sem token — redireciona para login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verifica permissão por rota
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
      pathname.startsWith(route)
    )

    if (matchedRoute) {
      const allowedRoles = ROUTE_PERMISSIONS[matchedRoute]
      if (!allowedRoles.includes(role)) {
        // Role não tem acesso — redireciona para o home do seu role
        return NextResponse.redirect(new URL(getHomeByRole(role), req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => true
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|images|assets).*)'
  ]
}
