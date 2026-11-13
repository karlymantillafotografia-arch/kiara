import { createClient } from '@supabase/supabase-js'
import { ENV, hasSupabaseEnv } from './env'

if (!hasSupabaseEnv()) {
  console.warn(
    '[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (Vercel / .env)',
  )
}

export const supabase = createClient(
  ENV.supabaseUrl || 'https://example.supabase.co',
  ENV.supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

export function isSupabaseConfigured() {
  return hasSupabaseEnv()
}
