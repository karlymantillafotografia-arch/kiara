import { ENV } from './env'

const PIN_KEY = 'xv-kiara-registro-ok'

/** PIN del registro privado (?registro=1). */
export const REGISTRO_PIN = 'kiara15'

export function isRegistroUnlocked() {
  try {
    return sessionStorage.getItem(PIN_KEY) === '1'
  } catch {
    return false
  }
}

export function unlockRegistro(pin) {
  if (String(pin).trim() !== REGISTRO_PIN) return false
  try {
    sessionStorage.setItem(PIN_KEY, '1')
  } catch {
    /* ignore */
  }
  return true
}

export function lockRegistro() {
  try {
    sessionStorage.removeItem(PIN_KEY)
  } catch {
    /* ignore */
  }
}

export function exportRegistrosCsv(rows) {
  const header = ['Tarjeta', 'Pases', 'Confirmacion', 'Fecha', 'Notas']
  const estadoLabel = { si: 'Si', no: 'No', pendiente: 'Pendiente' }
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        csvCell(row.tarjeta),
        row.pases,
        estadoLabel[row.estado] || row.estado,
        csvCell(formatFecha(row.fecha)),
        csvCell(row.notas || ''),
      ].join(','),
    ),
  ]
  return lines.join('\n')
}

function csvCell(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function formatFecha(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

/** Link personalizado de la tarjeta (WhatsApp / QR físico). */
export function buildInviteUrl(tarjeta, pases = 2) {
  const publicBase = ENV.publicInviteUrl
  const base = publicBase || window.location.href
  const url = new URL(base)
  url.search = ''
  url.hash = ''
  // %20 funciona mejor que + en WhatsApp
  url.searchParams.set('para', String(tarjeta || '').trim())
  url.searchParams.set('pases', String(Number(pases) || 2))
  return url.toString()
}

/** Texto listo para pegar en WhatsApp (enlace clickeable https). */
export function inviteWhatsAppShareText(tarjeta, pases = 2) {
  const link = buildInviteUrl(tarjeta, pases)
  return [
    `Hola, esta es tu invitación a los XV de Kiara 💌`,
    ``,
    `Abre tu tarjeta aquí:`,
    link,
  ].join('\n')
}
