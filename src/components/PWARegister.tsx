'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    // O Serwist (@serwist/next) já injeta o registro do SW automaticamente
    // no build de produção. Este componente apenas cuida do tratamento
    // de atualizações quando o SW fica descontrolado.

    if (!('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      // Quando um novo SW assume o controle, recarrega para evitar
      // cache velho servindo a página
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Verifica se há um SW instalado e limpa caches problemáticos
    navigator.serviceWorker.ready.then((registration) => {
      // Verifica atualizações a cada 5 minutos
      const interval = setInterval(() => {
        registration.update().catch(() => {
          // Silencia erros de rede ao verificar atualizações
        })
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
    })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
