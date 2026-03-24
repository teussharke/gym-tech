// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// // Public routes that don't require authentication
// const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/']

// // Role-based route access
// const roleRoutes: Record<string, string[]> = {
//   admin: ['/dashboard', '/admin', '/perfil', '/configuracoes', '/notificacoes'],
//   professor: ['/dashboard', '/professor', '/perfil', '/notificacoes'],
//   aluno: ['/dashboard', '/aluno', '/perfil', '/notificacoes'],
// }

// export async function middleware(req: NextRequest) {
//   const res = NextResponse.next()
//   const supabase = createMiddlewareClient({ req, res })

//   const { data: { session } } = await supabase.auth.getSession()
//   const pathname = req.nextUrl.pathname

//   // Allow public routes
//   if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
//     // If already authenticated, redirect to dashboard
//     if (session && (pathname === '/login' || pathname === '/')) {
//       return NextResponse.redirect(new URL('/dashboard', req.url))
//     }
//     return res
//   }

//   // Require authentication for protected routes
//   if (!session) {
//     const redirectUrl = new URL('/login', req.url)
//     redirectUrl.searchParams.set('redirect', pathname)
//     return NextResponse.redirect(redirectUrl)
//   }

//   // Get user role for RBAC
//   const { data: usuario } = await supabase
//     .from('usuarios')
//     .select('role, status')
//     .eq('id', session.user.id)
//     .single()

//   if (!usuario || usuario.status === 'inativo') {
//     await supabase.auth.signOut()
//     return NextResponse.redirect(new URL('/login?error=account_inactive', req.url))
//   }

//   // Check role-based access
//   const userRole = usuario.role as keyof typeof roleRoutes
//   const allowedPrefixes = roleRoutes[userRole] ?? []
  
//   const hasAccess = allowedPrefixes.some(prefix => 
//     pathname === prefix || pathname.startsWith(prefix + '/')
//   )

//   if (!hasAccess) {
//     return NextResponse.redirect(new URL('/dashboard', req.url))
//   }

//   return res
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
//   ],
// }

// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// // No modo local, o controle de autenticação é feito no lado do cliente (useAuth + localStorage)
// // O middleware apenas garante que rotas de auth não bloqueiem a navegação
// export function middleware(req: NextRequest) {
//   return NextResponse.next()
// }

// export const config = {
//   matcher: [],
// }

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware mínimo — autenticação controlada no cliente via useAuth + localStorage
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
