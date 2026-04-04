'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Splash Screen ────────────────────────────────────────
export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      {/* Círculos decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-bounce-in">
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/40 animate-float">
          <Image
            src="/icons/icon-192x192.png"
            alt="i9 Fitness"
            width={112} height={112}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">i9 Fitness</h1>
          <p className="text-orange-400 text-sm font-medium mt-1">Sistema de Gestão</p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full"
            style={{ animation: 'loading-bar 1.8s ease-out forwards' }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}

// ── PWA Install Banner ────────────────────────────────────
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verifica se já foi instalado ou dispensado
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed')
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (wasDismissed || isInstalled) return

    // iOS detection
    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream
    if (ios) {
      setIsIOS(true)
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-50 animate-slide-in">
      <div className="glass-dark rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-orange-500/30 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
          <Image src="/icons/icon-192x192.png" alt="i9 Fitness" width={48} height={48} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Instalar i9 Fitness</p>
          <p className="text-gray-400 text-xs">
            {isIOS
              ? 'Toque em Compartilhar → "Tela de Início"'
              : 'Adicionar à tela inicial como app'
            }
          </p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {!isIOS && (
            <button onClick={handleInstall}
              className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">
              Instalar
            </button>
          )}
          <button onClick={handleDismiss} className="text-gray-500 text-xs text-center hover:text-gray-300 transition-colors">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Animated Exercise Image (GIF Simulation) ─────────────
export function AnimatedExerciseImage({ src, alt, onError, className }: { src: string; alt: string; onError?: () => void; className?: string }) {
  const [frame, setFrame] = useState(0)
  
  useEffect(() => {
    if (!src || !src.endsWith('0.jpg')) return
    const t = setInterval(() => setFrame(f => f === 0 ? 1 : 0), 1000)
    return () => clearInterval(t)
  }, [src])
  
  const currentSrc = src && src.endsWith('0.jpg') ? src.replace('0.jpg', `${frame}.jpg`) : src

  return <img src={currentSrc || ''} alt={alt} className={className || "w-full h-full object-cover"} onError={onError} />
}

// ── Skeleton Components ──────────────────────────────────
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card-base p-4 space-y-3 animate-pulse">
      <div className="skeleton h-5 w-3/4 rounded" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${i === lines - 2 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="card-base p-4 space-y-2 animate-pulse">
      <div className="skeleton h-8 w-16 rounded mx-auto" />
      <div className="skeleton h-3 w-20 rounded mx-auto" />
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card-base overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="skeleton h-7 w-48 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <SkeletonCard lines={4} />
      <SkeletonList rows={3} />
    </div>
  )
}
