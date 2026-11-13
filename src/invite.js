/** Valores por defecto editables. La URL los puede sobrescribir. */
export const DEFAULT_PASSES = 2
export const DEFAULT_GUEST = ''
const MAX_PASSES = 12

/** WhatsApp donde llegan las confirmaciones. Solo dígitos, con código de país. */
export const RSVP_WHATSAPP = (
  import.meta.env.VITE_WHATSAPP || '573118523499'
).replace(/\D/g, '')

export const EVENT = {
  name: 'Kiara Karyn Jhordana Mantilla Gómez',
  shortName: 'Kiara',
  monogram: 'KM',
  dateLabel: '21 · 11 · 26',
  dateLong: 'Sábado 21 de noviembre de 2026',
  timeLabel: '6:00 p.m.',
  venue: 'Estadero Las Margaritas',
  /**
   * Ubicación fijada (coordenadas del pin).
   * Para cambiarla: abre Google Maps → marca el lugar exacto → clic derecho
   * "¿Qué hay aquí?" → copia lat,lng → pégalos abajo.
   * Opcional: pega también el link de "Compartir" en mapsShareUrl.
   */
  mapsQuery: 'Estadero Las Margaritas',
  mapsLat: 7.067944,
  mapsLng: -70.72675,
  mapsShareUrl: '',
  datetime: new Date('2026-11-21T18:00:00-05:00'),
}

/**
 * Personalización por invitado:
 *   ?pases=4&para=Familia%20López
 * También acepta: nombre= / familia=
 */
export function getInviteFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search)
  const raw = Number(params.get('pases'))
  const pases =
    Number.isFinite(raw) && raw >= 1
      ? Math.min(MAX_PASSES, Math.floor(raw))
      : DEFAULT_PASSES

  const para = (
    params.get('para') ||
    params.get('nombre') ||
    params.get('familia') ||
    DEFAULT_GUEST ||
    ''
  ).trim()

  return { pases, para }
}

export function passesLabel(count) {
  return count === 1 ? '1 pase' : `${count} pases`
}

export function mapsEmbedUrl() {
  const { mapsLat, mapsLng } = EVENT
  const delta = 0.012
  const left = mapsLng - delta
  const right = mapsLng + delta
  const top = mapsLat + delta
  const bottom = mapsLat - delta
  // OpenStreetMap se ve siempre en iframe; el botón abre Google Maps con el pin.
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${mapsLat}%2C${mapsLng}`
}

export function mapsOpenUrl() {
  const { mapsLat, mapsLng, mapsShareUrl } = EVENT
  if (mapsShareUrl) return mapsShareUrl
  // Abre Google Maps con el marcador ya fijado en esas coordenadas
  return `https://www.google.com/maps?q=${mapsLat},${mapsLng}&z=17`
}

export function whatsappConfirmUrl({ attending, para, pases }) {
  const tarjeta = (para || '').trim() || 'Sin nombre en tarjeta'
  const pasesTxt = `${pases} ${pases === 1 ? 'pase' : 'pases'}`
  const answer = attending
    ? [
        '✅ Confirmación XV de Kiara',
        '',
        `Tarjeta: ${tarjeta}`,
        `Pases: ${pasesTxt}`,
        'Respuesta: Sí, asistiré',
        '',
        '¡Ahí estaremos!',
      ].join('\n')
    : [
        'Confirmación XV de Kiara',
        '',
        `Tarjeta: ${tarjeta}`,
        `Pases: ${pasesTxt}`,
        'Respuesta: No podré asistir',
      ].join('\n')

  const text = encodeURIComponent(answer)
  if (RSVP_WHATSAPP) {
    return `https://wa.me/${RSVP_WHATSAPP}?text=${text}`
  }
  return `https://wa.me/?text=${text}`
}
