import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  runtimeCaching: [
    // ── Supabase REST API ─────────────────────────────────────────────────
    // IMPORTANTE: Supabase usa Bearer token no Authorization header.
    // NÃO usar credentials:"include" — causaria CORS porque Supabase retorna
    // Access-Control-Allow-Origin: * (wildcard incompatível com credentials).
    // NetworkFirst já faz fallback para cache quando a rede falha.
    // ── Supabase Auth: NUNCA cachear ──────────────────────────────────────
    // Requisições de autenticação (token, session) devem SEMPRE ir pra rede.
    // Cachear estas rotas causa loops de login com tokens stale.
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase.co") && url.pathname.includes("/auth/"),
      handler: new NetworkFirst({
        cacheName: "supabase-auth-nocache",
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheWillUpdate: async () => null, // Nunca salva no cache
          },
        ],
      }),
    },
    // ── Supabase REST API (dados, NÃO auth) ───────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase.co") && url.pathname.includes("/rest/"),
      handler: new NetworkFirst({
        cacheName: "supabase-api-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    // ── Supabase Storage (imagens de exercícios e fotos) ──────────────────
    // StaleWhileRevalidate: serve do cache imediatamente, atualiza em background
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase.co") && url.pathname.includes("/storage/"),
      handler: new StaleWhileRevalidate({
        cacheName: "supabase-storage-cache",
      }),
    },
    // ── Fontes do Google ──────────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-cache",
      }),
    },
    // Fallback padrão do Serwist para todos os outros recursos
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  let data: { title?: string; body?: string; url?: string } = {}
  try { data = event.data.json() } catch { data = { title: 'i9 Fitness', body: event.data.text() } }

  const title = data.title ?? 'i9 Fitness'
  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly WindowClient[]) => {
      const existing = clientList.find((c: WindowClient) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
