'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Shield } from 'lucide-react'

const COOKIE_KEY = 'i9_cookie_consent_v1'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY)
      if (!consent) setVisible(true)
    } catch {
      // localStorage indisponível — não mostra o banner
    }
  }, [])

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() })) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[90] safe-bottom"
      style={{
        background: 'rgba(9,9,14,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Barra neon no topo */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--neon), transparent)' }} />

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,107,0,0.15)' }}>
          <Cookie className="w-4 h-4" style={{ color: 'var(--neon)' }} />
        </div>

        <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-2)' }}>
          Utilizamos <strong style={{ color: 'var(--text-1)' }}>cookies técnicos essenciais</strong> para autenticação e funcionamento do sistema (Supabase Auth).
          Não usamos cookies de rastreamento ou publicidade.{' '}
          <Link href="/privacidade" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--neon)' }}>
            Política de Privacidade
          </Link>
        </p>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            style={{ background: 'var(--neon)', color: '#000', boxShadow: '0 0 12px var(--neon-glow)' }}
          >
            <Shield className="w-3.5 h-3.5" />
            Entendi e aceito
          </button>
          <button
            onClick={accept}
            className="p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-chip)', color: 'var(--text-3)' }}
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
