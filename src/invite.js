const DEFAULT_PASSES = 2
const MAX_PASSES = 12

/** WhatsApp donde llegan las confirmaciones. Solo dígitos, con código de país. Ej: 573001112233 */
export const RSVP_WHATSAPP = (import.meta.env.VITE_WHATSAPP || '').replace(/\D/g, '')

export const EVENT = {
  name: 'Kiara Karyn Jhordana Mantilla Gómez',
  shortName: 'Kiara',
  monogram: 'KM',
  dateLabel: '21 · 11 · 26',
  dateLong: 'Sábado 21 de noviembre de 2026',
  timeLabel: '6:00 p.m.',
  venue: 'Estadero Las Margaritas',
  /** Pin aproximado: Estadero Hotel Las Margaritas (Flandes / vía Espinal–Girardot) */
  mapsQuery: 'Estadero Hotel Las Margaritas Flandes Tolima',
  mapsLat: 4.215088,
  mapsLng: -74.849645,
  datetime: new Date('2026-11-21T18:00:00-05:00'),
}

export function getInviteFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search)
  const raw = Number(params.get('pases'))
  const pases =
    Number.isFinite(raw) && raw >= 1
      ? Math.min(MAX_PASSES, Math.floor(raw))
      : DEFAULT_PASSES

  const para = (params.get('para') || '').trim()

  return { pases, para }
}

export function passesLabel(count) {
  return count === 1 ? '1 pase' : `${count} pases`
}

export function mapsEmbedUrl() {
  const { mapsLat, mapsLng } = EVENT
  return `https://maps.google.com/maps?q=${mapsLat},${mapsLng}&z=16&output=embed`
}

export function mapsOpenUrl() {
  const { mapsLat, mapsLng, mapsQuery } = EVENT
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mapsQuery} @${mapsLat},${mapsLng}`)}`
}

export function whatsappConfirmUrl({ attending, para, pases }) {
  const guest = para || 'un invitado'
  const answer = attending
    ? `¡Hola! Confirmo asistencia a los XV de Kiara. Soy ${guest}, con ${pases} ${pases === 1 ? 'pase' : 'pases'}. ¡Ahí estaremos!`
    : `¡Hola! Soy ${guest}. Lamento no poder acompañarlos en los XV de Kiara.`

  const text = encodeURIComponent(answer)
  if (RSVP_WHATSAPP) {
    return `https://wa.me/${RSVP_WHATSAPP}?text=${text}`
  }
  return `https://wa.me/?text=${text}`
}
