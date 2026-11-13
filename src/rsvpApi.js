import { buildInviteUrl } from './registroStore'
import { isSupabaseConfigured, supabase } from './supabaseClient'

/**
 * Capa estable para el front.
 * Internamente lee/escribe `public.guests` en Supabase.
 * Externamente sigue exponiendo: { id, tarjeta, pases, estado, fecha, notas, link }
 */

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel / .env',
    )
  }
}

function mapGuestRow(row) {
  const stamp = row.responded_at || row.updated_at || row.created_at
  return {
    id: String(row.id),
    tarjeta: row.name,
    pases: Number(row.passes) || 1,
    estado: row.status,
    fecha: stamp ? new Date(stamp).toISOString() : new Date().toISOString(),
    notas: row.notes || '',
    link: row.invite_url || '',
  }
}

function supabaseError(error, fallback) {
  return error?.message || fallback
}

const GUEST_COLUMNS =
  'id, name, passes, status, notes, invite_url, created_at, updated_at, responded_at'

async function findGuestByName(tarjeta) {
  const { data, error } = await supabase
    .from('guests')
    .select('id, name, notes, invite_url')
    .limit(500)

  if (error) throw new Error(supabaseError(error, 'No se pudo buscar la tarjeta'))

  const needle = tarjeta.toLowerCase()
  return (data || []).find((row) => String(row.name).toLowerCase() === needle) || null
}

export async function fetchConfirmaciones() {
  assertConfigured()
  const { data, error } = await supabase
    .from('guests')
    .select(GUEST_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(supabaseError(error, 'No se pudo cargar el registro'))
  return (data || []).map(mapGuestRow)
}

export async function saveConfirmacion(entry) {
  assertConfigured()
  const tarjeta = String(entry.tarjeta || '').trim()
  if (!tarjeta) throw new Error('Falta el nombre de la tarjeta')

  const pases = Math.min(12, Math.max(1, Number(entry.pases) || 2))
  const estado = ['si', 'no', 'pendiente'].includes(entry.estado)
    ? entry.estado
    : 'pendiente'
  const notas =
    entry.notas != null ? String(entry.notas).trim() || null : undefined
  const link = entry.link || buildInviteUrl(tarjeta, pases)
  const now = new Date().toISOString()

  const existing = await findGuestByName(tarjeta)

  const payload = {
    name: tarjeta,
    passes: pases,
    status: estado,
    invite_url: link,
    updated_at: now,
    responded_at: estado === 'pendiente' ? null : now,
  }

  if (notas !== undefined) payload.notes = notas
  else if (!existing) payload.notes = null

  let row
  if (existing?.id) {
    if (!payload.invite_url && existing.invite_url) {
      payload.invite_url = existing.invite_url
    }
    const { data, error } = await supabase
      .from('guests')
      .update(payload)
      .eq('id', existing.id)
      .select(GUEST_COLUMNS)
      .single()
    if (error) throw new Error(supabaseError(error, 'No se pudo guardar la confirmación'))
    row = data
  } else {
    const { data, error } = await supabase
      .from('guests')
      .insert(payload)
      .select(GUEST_COLUMNS)
      .single()
    if (error) throw new Error(supabaseError(error, 'No se pudo guardar la confirmación'))
    row = data
  }

  const rows = await fetchConfirmaciones()
  return { row: mapGuestRow(row), rows }
}

export async function deleteConfirmacion(id) {
  assertConfigured()
  const { error } = await supabase.from('guests').delete().eq('id', id)
  if (error) throw new Error(supabaseError(error, 'No se pudo eliminar'))
  const rows = await fetchConfirmaciones()
  return { rows }
}
