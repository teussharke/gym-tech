'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Se já está logado, redireciona
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error('Email ou senha incorretos')
        setIsLoading(false)
        return
      }

      if (data.session) {
        await new Promise(r => setTimeout(r, 300))
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — imagem/marca (apenas desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-black p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
            <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={56} height={56} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">i9 Fitness</h1>
            <p className="text-orange-400 text-sm font-medium">Sistema de Gestão</p>
          </div>
        </div>

        {/* Slogan */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Gerencie sua<br />
              <span className="text-orange-500">academia</span><br />
              com eficiência
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Alunos, treinos, avaliações e financeiro<br />em um único lugar.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              '✓ Gestão completa de alunos',
              '✓ Fichas de treino personalizadas',
              '✓ Check-in e frequência',
              '✓ Relatórios financeiros',
            ].map(f => (
              <p key={f} className="text-gray-300 text-sm font-medium">{f}</p>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-xs">
          © {new Date().getFullYear()} Desenvolvido por: Mateus Oliveira i9 Fitness. Todos os direitos reservados.
        </p>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-950 lg:bg-white lg:dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-orange-500/30">
              <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={80} height={80} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-tight">i9 Fitness</h1>
              <p className="text-orange-400 text-sm">Sistema de Gestão</p>
            </div>
          </div>

          {/* Header */}
          <div className="hidden lg:block">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Bem-vindo!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Faça login para acessar o sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 lg:text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                className="w-full bg-gray-900 lg:bg-white lg:dark:bg-gray-800 border border-gray-700 lg:border-gray-200 lg:dark:border-gray-700
                           text-white lg:text-gray-900 lg:dark:text-white placeholder-gray-600
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
                           transition-all disabled:opacity-50"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 lg:text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full bg-gray-900 lg:bg-white lg:dark:bg-gray-800 border border-gray-700 lg:border-gray-200 lg:dark:border-gray-700
                             text-white lg:text-gray-900 lg:dark:text-white placeholder-gray-600
                             rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
                             transition-all disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 lg:hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600
                         disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold
                         py-3.5 rounded-xl transition-all duration-200 active:scale-95
                         shadow-lg shadow-orange-500/30 text-base"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" />Entrando...</>
                : 'Entrar'
              }
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs lg:hidden">
            © {new Date().getFullYear()} i9 Fitness
          </p>
        </div>
      </div>
    </div>
  )
}
