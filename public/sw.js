// public/sw.js
// Service Worker do GymFlow PWA

const CACHE_NAME = 'gymflow-v1'
const OFFLINE_URL = '/offline'

// Arquivos para cache na instalação
const STATIC_CACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/login',
  '/manifest.json',
]

// Instalar SW e fazer cache dos recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto')
      return cache.addAll(STATIC_CACHE).catch((err) => {
        console.warn('[SW] Erro no cache inicial:', err)
      })
    })
  )
  self.skipWaiting()
})

// Ativar SW e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...')
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deletando cache antigo:', name)
            return caches.delete(name)
          })
      )
    )
  )
  self.clients.claim()
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições para Supabase e APIs externas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('githubusercontent.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return
  }

  // Para navegação: tenta rede, cai para cache, cai para offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Atualiza cache com resposta nova
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          )
        )
    )
    return
  }

  // Para outros recursos: cache primeiro, rede como fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
  }
})

// Receber push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'Nova notificação do GymFlow',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/notificacoes' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'GymFlow', options)
  )
})

// Clique em notificação push
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
