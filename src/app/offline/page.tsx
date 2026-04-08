'use client'

import { WifiOff, Dumbbell, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export default function OfflinePage() {
  const [reloading, setReloading] = useState(false)

  const handleReload = () => {
    setReloading(true)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#09090E' }}>

      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg"
          style={{ boxShadow: '0 0 20px rgba(255,107,0,0.4)' }}>
          <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={40} height={40} />
        </div>
        <span className="text-white font-black text-lg tracking-tight">i9 Fitness</span>
      </div>

      {/* Ícone principal */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
          <WifiOff className="w-10 h-10" style={{ color: '#FF6B00' }} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: '#111118', border: '2px solid #1a1a24' }}>
          <span className="text-sm">📴</span>
        </div>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-black text-white text-center mb-2">
        Você está offline
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: '#6b7280' }}>
        Sem conexão com a internet no momento.
      </p>

      {/* O que ainda funciona */}
      <div className="w-full max-w-xs mb-8 rounded-2xl overflow-hidden"
        style={{ background: '#111118', border: '1px solid #1e1e2a' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e1e2a' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Disponível offline
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,107,0,0.12)' }}>
              <Dumbbell className="w-4 h-4" style={{ color: '#FF6B00' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Meu treino</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Acesse em /treino</p>
            </div>
            <CheckCircle2 className="w-4 h-4 ml-auto text-green-500 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Botão recarregar */}
      <button
        onClick={handleReload}
        disabled={reloading}
        className="flex items-center justify-center gap-2 w-full max-w-xs py-3.5 rounded-2xl font-bold text-black transition-all active:scale-95"
        style={{ background: '#FF6B00', boxShadow: '0 0 20px rgba(255,107,0,0.35)' }}>
        <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
        {reloading ? 'Reconectando...' : 'Tentar novamente'}
      </button>

      <p className="mt-6 text-xs text-center" style={{ color: '#374151' }}>
        i9 Fitness · Sistema de Gestão
      </p>
    </div>
  )
}
