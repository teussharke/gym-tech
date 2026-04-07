'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Usuario, UserRole } from '@/lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  usuario: Usuario | null
  role: UserRole | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsuario = useCallback(async (userId: string) => {
    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .abortSignal(controller.signal)
          .single()

        clearTimeout(timer)

        if (error) {
          // PGRST116 = row not found — não adianta tentar de novo
          if (error.code === 'PGRST116') {
            console.error('[useAuth] Usuário não encontrado na tabela usuarios para id:', userId)
            setUsuario(null)
            return
          }
          throw error
        }
        if (data) {
          setUsuario(data)
          return
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const isAbort = msg.includes('AbortError') || msg.includes('abort') || (err as { name?: string })?.name === 'AbortError'
        console.warn(`[useAuth] fetchUsuario tentativa ${attempt + 1}/${MAX_RETRIES}${isAbort ? ' (timeout)' : ''}:`, msg)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 800))
        }
      }
    }
    console.error('[useAuth] fetchUsuario falhou após todas as tentativas — userId:', userId)
    setUsuario(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) await fetchUsuario(user.id)
  }, [user?.id, fetchUsuario])

  // ── Detecta volta do background (tela desbloqueada / app reaberto) ──────
  useEffect(() => {
    let hiddenAt = 0
    const RELOAD_THRESHOLD = 3 * 60_000   // > 3 min → recarrega a página
    const REFRESH_THRESHOLD = 15_000       // > 15s  → renova a sessão

    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (document.visibilityState !== 'visible' || hiddenAt === 0) return

      const awayMs = Date.now() - hiddenAt
      hiddenAt = 0

      if (awayMs > RELOAD_THRESHOLD) {
        // Ficou muito tempo em background — reload garante sessão/conexão frescos
        window.location.reload()
        return
      }

      if (awayMs > REFRESH_THRESHOLD) {
        // Ficou alguns segundos — renova token silenciosamente
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) await fetchUsuario(session.user.id)
        } catch { /* ignora falha silenciosa */ }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchUsuario])

  useEffect(() => {
    let mounted = true

    // Timeout de segurança: garante que isLoading sempre vira false
    const safetyTimeout = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 6000)

    // onAuthStateChange dispara INITIAL_SESSION imediatamente com a sessão
    // atual do storage — mais confiável que getSession() isolado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        console.log('[useAuth] onAuthStateChange:', event, !!session)

        try {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchUsuario(session.user.id)

            // Atualiza último login em background — ignora falha
            if (event === 'SIGNED_IN') {
              void supabase
                .from('usuarios')
                .update({ ultimo_login: new Date().toISOString() })
                .eq('id', session.user.id)
            }
          } else {
            setUsuario(null)
          }
        } catch (err) {
          console.error('[useAuth] Erro no onAuthStateChange:', err)
          // NÃO limpa o usuário se já existia — evita loop de redirect
          if (mounted && !usuario) setUsuario(null)
        } finally {
          if (mounted) {
            clearTimeout(safetyTimeout)
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [fetchUsuario])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error | null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, usuario,
      role: usuario?.role ?? null,
      isLoading, signIn, signOut, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
