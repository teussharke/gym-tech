// 'use client'

// import { createContext, useContext, useEffect, useState, useCallback } from 'react'
// import { User, Session } from '@supabase/supabase-js'
// import { supabase } from '@/lib/supabase/client'
// import type { Usuario, UserRole } from '@/lib/types'

// interface AuthContextType {
//   user: User | null
//   session: Session | null
//   usuario: Usuario | null
//   role: UserRole | null
//   isLoading: boolean
//   signIn: (email: string, password: string) => Promise<{ error: Error | null }>
//   signOut: () => Promise<void>
//   refreshUser: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [session, setSession] = useState<Session | null>(null)
//   const [usuario, setUsuario] = useState<Usuario | null>(null)
//   const [isLoading, setIsLoading] = useState(true)

//   const fetchUsuario = useCallback(async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('usuarios')
//         .select('*')
//         .eq('id', userId)
//         .single()
      
//       if (error) throw error
//       setUsuario(data)
//     } catch (err) {
//       console.error('Error fetching usuario:', err)
//       setUsuario(null)
//     }
//   }, [])

//   const refreshUser = useCallback(async () => {
//     if (user?.id) {
//       await fetchUsuario(user.id)
//     }
//   }, [user?.id, fetchUsuario])

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session)
//       setUser(session?.user ?? null)
//       if (session?.user) {
//         fetchUsuario(session.user.id).finally(() => setIsLoading(false))
//       } else {
//         setIsLoading(false)
//       }
//     })

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setSession(session)
//         setUser(session?.user ?? null)
        
//         if (session?.user) {
//           await fetchUsuario(session.user.id)
//           // Update last login
//           if (event === 'SIGNED_IN') {
//             await supabase
//               .from('usuarios')
//               .update({ ultimo_login: new Date().toISOString() })
//               .eq('id', session.user.id)
//           }
//         } else {
//           setUsuario(null)
//         }
//         setIsLoading(false)
//       }
//     )

//     return () => subscription.unsubscribe()
//   }, [fetchUsuario])

//   const signIn = async (email: string, password: string) => {
//     try {
//       const { error } = await supabase.auth.signInWithPassword({ email, password })
//       return { error: error as Error | null }
//     } catch (err) {
//       return { error: err as Error }
//     }
//   }

//   const signOut = async () => {
//     await supabase.auth.signOut()
//     setUser(null)
//     setSession(null)
//     setUsuario(null)
//   }

//   const value: AuthContextType = {
//     user,
//     session,
//     usuario,
//     role: usuario?.role ?? null,
//     isLoading,
//     signIn,
//     signOut,
//     refreshUser,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Usuario, UserRole } from '@/lib/types'

// Usuários de demonstração locais
const MOCK_USERS: (Usuario & { password: string })[] = [
  {
    id: '1',
    nome: 'Administrador',
    email: 'admin@gymflow.com',
    password: '123456',
    role: 'admin',
    status: 'ativo',
    academia_id: 'academia-1',
    foto_url: null,
    telefone: '(32) 99999-0001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Prof. Carlos Souza',
    email: 'prof@gymflow.com',
    password: '123456',
    role: 'professor',
    status: 'ativo',
    academia_id: 'academia-1',
    foto_url: null,
    telefone: '(32) 99999-0002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'João Aluno Silva',
    email: 'aluno@gymflow.com',
    password: '123456',
    role: 'aluno',
    status: 'ativo',
    academia_id: 'academia-1',
    foto_url: null,
    telefone: '(32) 99999-0003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface AuthContextType {
  usuario: Usuario | null
  role: UserRole | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'gymflow_mock_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Recupera sessão salva no localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setUsuario(JSON.parse(saved))
      }
    } catch {
      // ignora erro
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    const found = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      return { error: new Error('Invalid login credentials') }
    }
    const { password: _, ...userWithoutPassword } = found
    setUsuario(userWithoutPassword)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword))
    return { error: null }
  }

  const signOut = async () => {
    setUsuario(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const refreshUser = async () => {}

  return (
    <AuthContext.Provider value={{
      usuario,
      role: usuario?.role ?? null,
      isLoading,
      signIn,
      signOut,
      refreshUser,
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
