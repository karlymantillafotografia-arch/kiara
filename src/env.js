/**
 * Variables públicas del front (Vite / Vercel).
 * En Vercel: Settings → Environment Variables → Production (y Preview si quieres).
 * Deben empezar con VITE_ para que el build las incluya.
 */

function read(name, fallback = '') {
  const value = import.meta.env[name]
  if (value == null || String(value).trim() === '') return fallback
  return String(value).trim()
}

export const ENV = {
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabaseAnonKey: read('VITE_SUPABASE_ANON_KEY'),
  publicInviteUrl: read('VITE_PUBLIC_INVITE_URL'),
}

export function hasSupabaseEnv() {
  return Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey)
}

export function hasPublicInviteUrl() {
  return Boolean(ENV.publicInviteUrl)
}
