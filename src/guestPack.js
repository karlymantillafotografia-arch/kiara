import { createRoot } from 'react-dom/client'
import QRCode from 'qrcode'
import { loadCardDesign } from './cardDesignStore'
import { exportCardPdf } from './exportCardPdf'
import { buildInviteUrl } from './registroStore'
import { createElement } from 'react'
import { CardPreview } from './TarjetaFisica'

function safeFileName(name, fallback = 'invitado') {
  return String(name || fallback)
    .trim()
    .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 40) || fallback
}

function triggerDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Descarga el PNG del QR para la invitación digital. */
export async function downloadGuestQr(tarjeta, pases = 2) {
  const link = buildInviteUrl(tarjeta, pases)
  const dataUrl = await QRCode.toDataURL(link, {
    width: 512,
    margin: 2,
    color: { dark: '#1a3348', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
  const name = safeFileName(tarjeta, 'tarjeta').toLowerCase()
  triggerDownload(dataUrl, `qr-${name}.png`)
  return link
}

async function waitForCardReady(host, timeoutMs = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const card = host.querySelector('.phys-card')
    const qrImg = host.querySelector('.phys-card__qr-wrap img')
    const bgImgs = [...host.querySelectorAll('.phys-card__bg')]
    const bgsReady = bgImgs.length >= 3 && bgImgs.every((img) => img.complete && img.naturalWidth > 0)
    const qrReady = Boolean(qrImg?.src) && (qrImg.complete || qrImg.src.startsWith('data:'))
    if (card && bgsReady && qrReady) {
      if (qrImg && !qrImg.complete) {
        await new Promise((resolve) => {
          qrImg.addEventListener('load', resolve, { once: true })
          qrImg.addEventListener('error', resolve, { once: true })
        })
      }
      return card
    }
    await new Promise((r) => setTimeout(r, 40))
  }
  throw new Error('La tarjeta física no terminó de renderizar a tiempo')
}

/** Genera y descarga el PDF de la tarjeta física con el diseño guardado. */
export async function downloadGuestPhysicalPdf(tarjeta, pases = 2) {
  const link = buildInviteUrl(tarjeta, pases)
  const design = loadCardDesign()
  const guest = { id: 'pack', tarjeta, pases }

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:19.5cm',
    'opacity:0',
    'pointer-events:none',
    'z-index:2147483645',
    'overflow:visible',
  ].join(';')
  document.body.appendChild(host)

  const root = createRoot(host)
  try {
    root.render(createElement(CardPreview, { design, guest, link }))
    if (document.fonts?.ready) await document.fonts.ready
    const card = await waitForCardReady(host)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const name = safeFileName(tarjeta, 'muestra')
    await exportCardPdf(card, { filename: `tarjeta-kiara-${name}.pdf` })
  } finally {
    root.unmount()
    host.remove()
  }
}

/**
 * Al crear una tarjeta: QR + enlace digital (ya copiado aparte) + PDF físico.
 * @returns {{ link: string }}
 */
export async function createGuestPack(tarjeta, pases = 2) {
  const link = await downloadGuestQr(tarjeta, pases)
  // Pequeña pausa para que el navegador acepte la segunda descarga
  await new Promise((r) => setTimeout(r, 280))
  await downloadGuestPhysicalPdf(tarjeta, pases)
  return { link }
}
