'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Admin',     email: 'admin@gymflow.com', color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300' },
  { label: 'Professor', email: 'prof@gymflow.com',  color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' },
  { label: 'Aluno',     email: 'aluno@gymflow.com', color: 'bg-green-500/20 hover:bg-green-500/30 text-green-300' },
]

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email) errs.email = 'Email obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email inválido'
    if (!password) errs.password = 'Senha obrigatória'
    else if (password.length < 6) errs.password = 'Mínimo 6 caracteres'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setIsLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error('Email ou senha incorretos')
        return
      }
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('123456')
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">GymFlow</h1>
          <p className="text-gray-400 mt-1">Sistema de Gestão de Academia</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-slide-in">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500
                           rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2
                           focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500
                             rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2
                             focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Esqueceu senha */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500
                         disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold
                         py-2.5 rounded-lg transition-all duration-200 active:scale-95 mt-2
                         shadow-lg shadow-primary-500/30"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
              ) : 'Entrar'}
            </button>
          </form>

          {/* Contas demo */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center mb-3">Contas de demonstração</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ label, email: demoEmail, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => fillDemo(demoEmail)}
                  className={`${color} text-xs font-medium py-1.5 px-2 rounded-lg transition-all`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs text-center mt-2">Senha: 123456</p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 GymFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
