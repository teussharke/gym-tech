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

  // Auto-healing: Limpa caches PWA cheios se voltamos pro login (Evita QuotaExceededError)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => caches.delete(name))
      }).catch(() => {})
    }
  }, [])

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
        const queryRes = await supabase
          .from('usuarios')
          .select('configuracoes')
          .eq('id', data.session?.user?.id)
          .single()
          
        const usuarioRecord = queryRes.data as unknown as { configuracoes: any } | null

        await new Promise(r => setTimeout(r, 300))

        if (usuarioRecord?.configuracoes && usuarioRecord.configuracoes.primeiro_acesso) {
          window.location.href = '/primeiro-acesso'
        } else {
          window.location.href = '/dashboard'
        }
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
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 0 30px rgba(255,107,0,0.4)' }}>
              <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={80} height={80} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>i9 Fitness</h1>
              <p className="text-sm" style={{ color: 'var(--neon)' }}>Sistema de Gestão</p>
            </div>
          </div>

          {/* Header */}
          <div className="hidden lg:block">
            <h2 className="text-3xl font-black" style={{ color: 'var(--text-1)' }}>Bem-vindo!</h2>
            <p className="mt-1" style={{ color: 'var(--text-2)' }}>Faça login para acessar o sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                className="input-base"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
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
                  className="input-base pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-3)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--neon)' }}>
                Esqueceu sua senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" />Entrando...</>
                : 'Entrar'
              }
            </button>
          </form>

          <p className="text-center text-xs lg:hidden" style={{ color: 'var(--text-3)' }}>
            © {new Date().getFullYear()} Mateus Oliveira
          </p>
        </div>
      </div>
    </div>
  )
}
