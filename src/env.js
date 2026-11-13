/**
 * Config fija del front (sin variables de Vercel / .env).
 */

export const ENV = {
  supabaseUrl: 'https://wjiwjugsvzqrnkswjneb.supabase.co',
  supabaseAnonKey: 'sb_publishable_gPRmnSPo5vn_frNqb5h05g_u-K5qdA1',
  publicInviteUrl: 'https://kiara-phi.vercel.app/',
}

export function hasSupabaseEnv() {
  return true
}

export function hasPublicInviteUrl() {
  return true
}

export function resolveInviteBase() {
  return ENV.publicInviteUrl
}
