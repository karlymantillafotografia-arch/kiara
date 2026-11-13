/** Valores por defecto editables. La URL los puede sobrescribir. */
export const DEFAULT_PASSES = 2
export const DEFAULT_GUEST = ''
const MAX_PASSES = 12

/** WhatsApp donde llegan las confirmaciones. Solo dígitos, con código de país. */
export const RSVP_WHATSAPP = '573118523499'

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
  return count === 1 ? '1 cupo' : `${count} cupos`
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
  const cuposTxt = `${pases} ${pases === 1 ? 'cupo' : 'cupos'}`
  const answer = attending
    ? [
        '✅ Confirmación XV de Kiara',
        '',
        `Tarjeta: ${tarjeta}`,
        `Cupos: ${cuposTxt}`,
        'Respuesta: Sí, asistiré',
        '',
        '¡Ahí estaremos!',
      ].join('\n')
    : [
        'Confirmación XV de Kiara',
        '',
        `Tarjeta: ${tarjeta}`,
        `Cupos: ${cuposTxt}`,
        'Respuesta: No podré asistir',
      ].join('\n')

  const text = encodeURIComponent(answer)
  if (RSVP_WHATSAPP) {
    return `https://wa.me/${RSVP_WHATSAPP}?text=${text}`
  }
  return `https://wa.me/?text=${text}`
}

function toCalendarStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Datos del evento para recordatorio / calendario (inicio 6 p.m., fin 2 a.m.). */
export function getCalendarEvent() {
  const start = new Date(EVENT.datetime)
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000)
  const title = `XV de ${EVENT.shortName}`
  const location = EVENT.venue
  const details = [
    `Celebración de los XV años de ${EVENT.name}.`,
    `${EVENT.dateLong} · ${EVENT.timeLabel}`,
    EVENT.venue,
    mapsOpenUrl(),
  ].join('\n')

  return { start, end, title, location, details }
}

export function googleCalendarUrl() {
  const { start, end, title, location, details } = getCalendarEvent()
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    details,
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Descarga un .ics (Apple Calendar, Outlook y la mayoría de calendarios). */
export function downloadCalendarIcs() {
  const { start, end, title, location, details } = getCalendarEvent()
  const stamp = toCalendarStamp(new Date())
  const escapeIcs = (value) =>
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XV Kiara//Invitacion//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:xv-kiara-${toCalendarStamp(start)}@kiara`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toCalendarStamp(start)}`,
    `DTEND:${toCalendarStamp(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `LOCATION:${escapeIcs(location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(`Recordatorio: ${title}`)}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(`Recordatorio: ${title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'xv-kiara.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
