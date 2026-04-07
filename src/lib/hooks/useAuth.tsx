'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

const CACHE_KEY = 'i9_usuario_v1'

function readCache(): Usuario | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Usuario
  } catch { return null }
}

// Cacheia apenas campos não-sensíveis (sem CPF, telefone, endereço, data de nascimento)
function writeCache(u: Usuario) {
  try {
    const safe = {
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      status: u.status,
      foto_url: u.foto_url,
      academia_id: u.academia_id,
      configuracoes: u.configuracoes,
      ultimo_login: u.ultimo_login,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(safe))
  } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  // ── Busca usuario da tabela — simples, sem AbortController ──────────────
  const fetchUsuario = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.error('[useAuth] Usuário não encontrado na tabela usuarios:', userId)
          setUsuario(null)
          clearCache()
          return false
        }
        throw error
      }

      if (data && mountedRef.current) {
        setUsuario(data)
        writeCache(data)
        return true
      }
    } catch (err) {
      console.warn('[useAuth] fetchUsuario erro:', err instanceof Error ? err.message : err)
      // NÃO limpa usuario se já temos cache — a app continua funcionando
    }
    return false
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) await fetchUsuario(user.id)
  }, [user?.id, fetchUsuario])

  // ── Inicialização: cache → auth state → DB ──────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    // 1) Tenta carregar do cache INSTANTANEAMENTE
    const cached = readCache()
    if (cached) {
      setUsuario(cached)
      // Não seta isLoading=false aqui porque precisamos confirmar a sessão auth
    }

    // 2) Safety timeout — apenas para caso onAuthStateChange nunca dispare
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        // Se temos cache, pode liberar a tela mesmo sem confirmação do DB
        if (readCache()) {
          setIsLoading(false)
        } else {
          // Sem cache e sem resposta — libera pra layout decidir (redirect)
          setIsLoading(false)
        }
      }
    }, 5000)

    // 3) onAuthStateChange — fonte de verdade para sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        if (!mountedRef.current) return

        setSession(sess)
        setUser(sess?.user ?? null)

        if (sess?.user) {
          // Se já temos cache do mesmo user, libera a tela imediatamente
          const cachedNow = readCache()
          if (cachedNow && cachedNow.id === sess.user.id) {
            setUsuario(cachedNow)
            setIsLoading(false)
            clearTimeout(safetyTimeout)
            // Refresh em background — atualiza dados sem bloquear
            fetchUsuario(sess.user.id)
          } else {
            // Sem cache válido — precisa esperar o fetch
            const ok = await fetchUsuario(sess.user.id)
            if (!ok && mountedRef.current) {
              // Fetch falhou e sem cache — tenta mais uma vez após 1s
              await new Promise(r => setTimeout(r, 1000))
              await fetchUsuario(sess.user.id)
            }
            if (mountedRef.current) {
              clearTimeout(safetyTimeout)
              setIsLoading(false)
            }
          }

          // Atualiza último login em background
          if (event === 'SIGNED_IN') {
            void supabase
              .from('usuarios')
              .update({ ultimo_login: new Date().toISOString() })
              .eq('id', sess.user.id)
          }
        } else {
          // Sem sessão — limpa tudo
          setUsuario(null)
          clearCache()
          if (mountedRef.current) {
            clearTimeout(safetyTimeout)
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [fetchUsuario])

  // ── Detecta volta do background ─────────────────────────────────────────
  useEffect(() => {
    let hiddenAt = 0

    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (document.visibilityState !== 'visible' || hiddenAt === 0) return

      const awayMs = Date.now() - hiddenAt
      hiddenAt = 0

      // Sempre tenta refrescar a sessão quando volta do background
      try {
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        if (freshSession?.user) {
          // Refresh silencioso — se falhar, cache segura a interface
          fetchUsuario(freshSession.user.id)
        } else if (awayMs > 3 * 60_000) {
          // Sem sessão e ficou muito tempo fora — reload
          window.location.reload()
        }
      } catch {
        // Offline ou erro — não faz nada, cache segura
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
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
    clearCache()
    setUser(null)
    setSession(null)
    setUsuario(null)
    await supabase.auth.signOut()
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
