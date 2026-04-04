// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

let supabaseInstance: any = null;

if (typeof window === 'undefined') {
  // No servidor, usar instância isolada (mínima)
  supabaseInstance = createClient<any, 'public', any>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
} else {
  // No cliente, garantir singleton estrito ignorando hot-reloads violentos
  if (!(window as any).__supabaseInstance) {
    ;(window as any).__supabaseInstance = createClient<any, 'public', any>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  supabaseInstance = (window as any).__supabaseInstance
}

export const supabase = supabaseInstance as ReturnType<typeof createClient<any, 'public', any>>;

export function createServerSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
