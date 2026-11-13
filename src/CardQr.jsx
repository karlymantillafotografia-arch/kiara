import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function CardQr({ link, tarjeta }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    QRCode.toDataURL(link, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1a3348',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo crear el QR')
      })
    return () => {
      cancelled = true
    }
  }, [link])

  function downloadQr() {
    if (!src) return
    const safeName = String(tarjeta || 'tarjeta')
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/gi, '-')
      .replace(/^-|-$/g, '')
    const a = document.createElement('a')
    a.href = src
    a.download = `qr-${safeName || 'invitacion'}.png`
    a.click()
  }

  if (error) return <p className="registro__error">{error}</p>
  if (!src) return <p className="registro__note-line">Generando QR…</p>

  return (
    <div className="registro__qr">
      <img src={src} alt={`QR de ${tarjeta}`} />
      <button type="button" className="registro__copy" onClick={downloadQr}>
        Descargar QR
      </button>
    </div>
  )
}
