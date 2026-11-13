const API = '/api/confirmaciones'

export async function fetchConfirmaciones() {
  const res = await fetch(API, { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo cargar el registro')
  const data = await res.json()
  return Array.isArray(data.rows) ? data.rows : []
}

export async function saveConfirmacion(entry) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar la confirmación')
  return data
}

export async function deleteConfirmacion(id) {
  const res = await fetch(API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo eliminar')
  return data
}
