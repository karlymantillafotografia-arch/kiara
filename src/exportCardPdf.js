import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function waitForImages(root) {
  const images = [...root.querySelectorAll('img')]
  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        }),
    ),
  )
}

/**
 * Captura la tarjeta visible y la guarda en PDF carta horizontal.
 * @param {HTMLElement} node .phys-card o contenedor
 * @param {{ filename?: string }} [options]
 */
export async function exportCardPdf(node, options = {}) {
  if (!node) throw new Error('No se encontró la tarjeta para exportar')

  const filename = options.filename || 'tarjeta-kiara-xv.pdf'
  const card = node.classList?.contains('phys-card')
    ? node
    : node.querySelector?.('.phys-card') || node

  // Clonar a un host visible (opacity 0) con tamaño fijo — evita cortes del scroll
  const host = document.createElement('div')
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:19.5cm',
    'height:13cm',
    'opacity:0',
    'pointer-events:none',
    'z-index:2147483646',
    'overflow:visible',
    'background:#ffffff',
  ].join(';')

  const clone = card.cloneNode(true)
  clone.style.cssText = [
    'width:19.5cm',
    'height:13cm',
    'margin:0',
    'box-shadow:none',
    'transform:none',
  ].join(';')

  const sheet = card.closest('.phys-sheet')
  if (sheet) {
    const cs = getComputedStyle(sheet)
    ;['--phys-accent', '--phys-ink', '--phys-soft'].forEach((key) => {
      const value = cs.getPropertyValue(key)
      if (value) clone.style.setProperty(key, value.trim())
    })
  }

  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    if (document.fonts?.ready) await document.fonts.ready
    await waitForImages(host)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 20000,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter',
      compress: true,
    })

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 0.35
    const maxW = pageW - margin * 2
    const maxH = pageH - margin * 2
    const ratio = canvas.width / canvas.height

    let drawW = maxW
    let drawH = drawW / ratio
    if (drawH > maxH) {
      drawH = maxH
      drawW = drawH * ratio
    }

    pdf.addImage(
      imgData,
      'PNG',
      (pageW - drawW) / 2,
      (pageH - drawH) / 2,
      drawW,
      drawH,
      undefined,
      'FAST',
    )
    pdf.save(filename)
  } finally {
    host.remove()
  }
}
