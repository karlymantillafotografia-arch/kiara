import { createClient } from '@supabase/supabase-js'
import { ENV } from './env'

export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export function isSupabaseConfigured() {
  return true
}
