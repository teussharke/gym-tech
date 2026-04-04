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
    // Retry com backoff — protege contra falhas transitórias de rede/lock
    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .single()
        if (error) throw error
        if (data) {
          setUsuario(data)
          return // sucesso
        }
      } catch (err) {
        console.warn(`[useAuth] fetchUsuario tentativa ${attempt + 1}/${MAX_RETRIES} falhou:`, err)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        }
      }
    }
    // Todas as tentativas falharam — mantém null
    console.error('[useAuth] fetchUsuario falhou após todas as tentativas')
    setUsuario(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) await fetchUsuario(user.id)
  }, [user?.id, fetchUsuario])

  useEffect(() => {
    let mounted = true

    // Timeout de segurança: garante que isLoading sempre vira false
    // mesmo se a rede falhar completamente
    const safetyTimeout = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 8000)

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
