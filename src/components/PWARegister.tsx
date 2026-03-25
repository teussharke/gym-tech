'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registrado:', reg.scope)

            // Verifica atualizações a cada 60 segundos
            setInterval(() => reg.update(), 60 * 1000)

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing
              newWorker?.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  if (confirm('Nova versão do GymFlow disponível! Atualizar agora?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            })
          })
          .catch((err) => console.warn('[PWA] Erro no registro:', err))
      })
    }
  }, [])

  return null
}
