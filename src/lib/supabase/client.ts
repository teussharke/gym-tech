// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

// Fetch com timeout global de 10s — evita queries travadas após tela bloqueada no PWA
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  // Só cria o timeout se a chamada não tiver signal próprio
  const hasOwnSignal = init?.signal != null
  const timer = hasOwnSignal ? null : setTimeout(() => controller.abort(), 10_000)
  const signal = hasOwnSignal ? init!.signal : controller.signal
  return fetch(input, { ...init, signal }).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export const supabase = createClient<any, 'public', any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  global: {
    fetch: fetchWithTimeout,
  },
})

export function createServerSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
