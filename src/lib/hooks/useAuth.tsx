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
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      setUsuario(data)
    } catch {
      setUsuario(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) await fetchUsuario(user.id)
  }, [user?.id, fetchUsuario])

  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUsuario(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUsuario(session.user.id)
          // Atualiza último login
          if (event === 'SIGNED_IN') {
            await supabase
              .from('usuarios')
              .update({ ultimo_login: new Date().toISOString() })
              .eq('id', session.user.id)
          }
        } else {
          setUsuario(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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
