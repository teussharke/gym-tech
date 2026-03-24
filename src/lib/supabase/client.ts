// import { createClient } from '@supabase/supabase-js'
// import type { Database } from '@/lib/types/database'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables. Check your .env.local file.')
// }

// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true,
//   },
// })

// // Server-side client with service role (use only in API routes)
// export function createServerSupabaseClient() {
//   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
//   if (!serviceKey) {
//     throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
//   }
//   return createClient<Database>(supabaseUrl, serviceKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//     },
//   })
// }

// src/lib/supabase/client.ts
// Quando usando mock local, este cliente não é utilizado
// Mantido para compatibilidade de tipos

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export function createServerSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
