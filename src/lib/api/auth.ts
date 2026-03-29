// src/lib/api/auth.ts
// Utilitário de autenticação para API routes Next.js
// Verifica o JWT do Supabase enviado pelo frontend no header Authorization

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export type ApiRole = 'admin' | 'professor' | 'aluno'

export interface AuthResult {
  userId: string
  role: ApiRole
  academiaId: string
}

// Cria cliente com anon key apenas para verificar o JWT do usuário
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cria cliente admin (service_role) para leituras internas
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Verifica o token Bearer da request e retorna dados do usuário.
 * Retorna null se o token for inválido ou ausente.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim()
  if (!token) return null

  // Verifica o JWT com o Supabase (usa anon key, não bypassa RLS)
  const { data: { user }, error } = await anonClient().auth.getUser(token)
  if (error || !user) return null

  // Busca role e academia do usuário (usa admin client pois a tabela usuarios
  // pode ter RLS que impede leitura sem contexto de sessão)
  const { data: usuario } = await adminClient()
    .from('usuarios')
    .select('role, academia_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.role || !usuario?.academia_id) return null

  return {
    userId: user.id,
    role: usuario.role as ApiRole,
    academiaId: usuario.academia_id,
  }
}

/** Resposta padrão de não autorizado */
export function unauthorized(msg = 'Não autorizado') {
  return NextResponse.json({ error: msg }, { status: 401 })
}

/** Resposta padrão de acesso negado */
export function forbidden(msg = 'Acesso negado') {
  return NextResponse.json({ error: msg }, { status: 403 })
}

/**
 * Guard: exige autenticação. Retorna [auth, null] ou [null, response].
 * Uso: const [auth, err] = await requireAuth(request)
 *      if (err) return err
 */
export async function requireAuth(
  request: NextRequest
): Promise<[AuthResult, null] | [null, NextResponse]> {
  const auth = await getAuthUser(request)
  if (!auth) return [null, unauthorized()]
  return [auth, null]
}

/**
 * Guard: exige role específica.
 */
export async function requireRole(
  request: NextRequest,
  ...roles: ApiRole[]
): Promise<[AuthResult, null] | [null, NextResponse]> {
  const auth = await getAuthUser(request)
  if (!auth) return [null, unauthorized()]
  if (!roles.includes(auth.role)) return [null, forbidden(`Requer perfil: ${roles.join(' ou ')}`)]
  return [auth, null]
}
