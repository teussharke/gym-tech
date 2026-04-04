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
    // ── Supabase REST API (dados do treino, exercícios, histórico) ──────────
    // NetworkFirst: tenta a rede primeiro, se falhar (offline) usa o cache
    // networkTimeoutSeconds: após 5s sem resposta, serve o cache imediatamente
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase.co") && url.pathname.includes("/rest/"),
      handler: new NetworkFirst({
        cacheName: "supabase-api-cache",
        fetchOptions: { credentials: "include" },
        matchOptions: { ignoreSearch: false },
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }: { request: Request }) => request.url,
            handlerDidError: async ({ request }: { request: Request }) => {
              // Retorna do cache se disponível, ou undefined para propagar erro
              const cache = await caches.open("supabase-api-cache");
              return (await cache.match(request)) ?? Response.error();
            },
          },
        ],
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
        plugins: [],
      }),
    },
    // ── Fontes do Google ──────────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-cache",
        plugins: [],
      }),
    },
    // Fallback padrão do Serwist para todos os outros recursos
    ...defaultCache,
  ],
});

serwist.addEventListeners();
