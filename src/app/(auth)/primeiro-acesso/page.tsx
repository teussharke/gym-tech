'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const { usuario, refreshUser } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  // Previne acesso se não for primeiro acesso
  useEffect(() => {
    if (usuario && usuario.configuracoes?.primeiro_acesso !== true) {
      router.replace('/dashboard')
    }
  }, [usuario, router])

  const validate = () => {
    const errs: { password?: string; confirmPassword?: string } = {}
    if (!password) errs.password = 'Nova senha é obrigatória'
    else if (password.length < 6) errs.password = 'Mínimo de 6 caracteres'
    
    if (!confirmPassword) errs.confirmPassword = 'Confirme sua senha'
    else if (password !== confirmPassword) errs.confirmPassword = 'As senhas não coincidem'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setIsLoading(true)

    try {
      // 1. Atualizar a senha no provedor de Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      })

      if (authError) {
        toast.error('Erro ao atualizar a senha: ' + authError.message)
        setIsLoading(false)
        return
      }

      // 2. Limpar a flag de primeiro acesso no banco
      if (usuario) {
        // Garantindo que mantemos outras configurações (tema, notificacoes)
        const currentConfig = typeof usuario.configuracoes === 'object' && usuario.configuracoes !== null 
          ? usuario.configuracoes 
          : {}
          
        const newConfig = { ...currentConfig, primeiro_acesso: false }
        
        const { error: dbError } = await (supabase
          .from('usuarios') as any)
          .update({ configuracoes: newConfig })
          .eq('id', usuario.id)

        if (dbError) {
          console.error(dbError)
          toast.error('Sua senha foi alterada, mas falhamos ao salvar no perfil. Contate o suporte.')
          setIsLoading(false)
          return
        }
      }

      toast.success('Senha configurada com sucesso!')
      await refreshUser()
      
      // Pequeno timeout para dar tempo da interface reagir ao toast e context
      setTimeout(() => {
        router.replace('/dashboard')
      }, 500)

    } catch (err) {
      toast.error('Ocorreu um erro inesperado')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" 
      style={{ background: 'var(--bg-base)' }}>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 p-8 rounded-3xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mb-2"
            style={{ boxShadow: '0 0 30px rgba(255,107,0,0.4)' }}>
            <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={80} height={80} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>Crie sua Senha</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
              Como este é seu primeiro acesso, por motivos de segurança, você precisa registrar sua própria senha confidencial.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                placeholder="••••••••"
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

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })) }}
                placeholder="••••••••"
                disabled={isLoading}
                className="input-base pr-11"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-3)' }}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2"
          >
            {isLoading
              ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</>
              : 'Salvar e Entrar'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
