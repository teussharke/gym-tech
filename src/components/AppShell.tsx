'use client'

// src/components/AppShell.tsx
// Client component separado para não contaminar o layout com 'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Splash Screen ──────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-5 animate-bounce-in">
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/40 animate-float">
          <Image
            src="/icons/icon-192x192.png"
            alt="i9 Fitness"
            width={112}
            height={112}
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">i9 Fitness</h1>
          <p className="text-orange-400 text-sm font-medium mt-1">Sistema de Gestão</p>
        </div>
      </div>

      {/* Barra de carregamento */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full animate-[loading_2s_ease-out_forwards]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}

// ── PWA Install Banner ────────────────────────────────
function PWABanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed')
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (dismissed || standalone) return

    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    if (ios) {
      setIsIOS(true)
      const t = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 4000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-50 animate-slide-in max-w-sm mx-auto">
      <div className="glass-dark rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-orange-500/30">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
          <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={44} height={44} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Instalar i9 Fitness</p>
          <p className="text-gray-400 text-xs truncate">
            {isIOS ? 'Toque em Compartilhar → "Tela de Início"' : 'Adicionar como app'}
          </p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!isIOS && (
            <button onClick={install}
              className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              Instalar
            </button>
          )}
          <button onClick={dismiss} className="text-gray-500 text-xs text-center hover:text-gray-300">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AppShell ───────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Splash apenas no PWA instalado (standalone), 1x por dia
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    const lastSplash = localStorage.getItem('i9-splash')
    const today = new Date().toDateString()
    if (isPWA && lastSplash !== today) {
      setShowSplash(true)
      localStorage.setItem('i9-splash', today)
    }
  }, [])

  // Evita flash antes de montar no cliente
  if (!mounted) return <>{children}</>

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {children}
      <PWABanner />
    </>
  )
}
