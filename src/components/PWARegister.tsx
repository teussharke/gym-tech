'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Limpa todos os SWs com falha de precache e caches corrompidos
    // Isso evita o loop infinito causado por bad-precaching-response
    const cleanupBrokenSW = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const reg of registrations) {
          // Se o SW está instalando mas nunca ativou (stuck), remove
          if (reg.installing && !reg.active) {
            await reg.unregister()
            console.log('[PWA] Removido SW travado em instalação')
          }
        }

        // Limpa caches antigos do Serwist que podem ter entradas 404
        const cacheKeys = await caches.keys()
        for (const key of cacheKeys) {
          // Caches do serwist com build ID antigo
          if (key.startsWith('serwist-precache') || key.startsWith('next-')) {
            // Verifica se o cache tem entradas ruins
            const cache = await caches.open(key)
            const entries = await cache.keys()
            let hasStale = false
            for (const entry of entries) {
              if (entry.url.includes('_ssgManifest') || entry.url.includes('_buildManifest')) {
                hasStale = true
                break
              }
            }
            if (hasStale) {
              await caches.delete(key)
              console.log('[PWA] Cache antigo removido:', key)
            }
          }
        }
      } catch (e) {
        // Silencia falhas de limpeza
      }
    }

    cleanupBrokenSW()

    // Recarrega APENAS quando um SW novo e saudável assume o controle
    // Usa um flag para evitar loop: só recarrega uma vez por sessão
    let reloaded = false
    const handleControllerChange = () => {
      if (!reloaded && navigator.serviceWorker.controller) {
        reloaded = true
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Verifica atualizações a cada 5 minutos
    navigator.serviceWorker.ready.then((registration) => {
      const interval = setInterval(() => {
        registration.update().catch(() => {})
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }).catch(() => {})

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}

