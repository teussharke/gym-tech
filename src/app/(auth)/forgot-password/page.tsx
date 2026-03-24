'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Digite um email válido')
      return
    }
    setError('')
    setIsLoading(true)
    // Mock — quando conectar ao Supabase substituir por:
    // await supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })
    await new Promise(r => setTimeout(r, 1000))
    setIsLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">GymFlow</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Recuperar senha</h2>
              <p className="text-gray-400 text-sm mb-6">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-all"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : 'Enviar link de recuperação'
                  }
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Email enviado!</h2>
              <p className="text-gray-400 text-sm">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
