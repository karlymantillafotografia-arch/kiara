import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!url || !anonKey) {
  console.warn(
    '[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env',
  )
}

export const supabase = createClient(
  url || 'https://example.supabase.co',
  anonKey || 'public-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

export function isSupabaseConfigured() {
  return Boolean(url && anonKey)
}
