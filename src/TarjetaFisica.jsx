import { useEffect, useMemo, useRef, useState } from 'react'
import CardQr from './CardQr'
import {
  DEFAULT_CARD_DESIGN,
  FIXED_GUEST_LAYOUT,
  loadCardDesign,
  resetCardDesign,
  saveCardDesign,
} from './cardDesignStore'
import { exportCardPdf } from './exportCardPdf'
import { buildInviteUrl } from './registroStore'

const SAMPLE = {
  id: 'sample',
  tarjeta: 'Nombre del invitado',
  pases: 2,
}

export default function TarjetaFisica({ rows }) {
  const [design, setDesign] = useState(() => loadCardDesign())
  const [savedMsg, setSavedMsg] = useState('')
  const [view, setView] = useState('abierta')
  const [previewMode, setPreviewMode] = useState('muestra')
  const [selectedId, setSelectedId] = useState(rows[0]?.id || '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const stageRef = useRef(null)

  useEffect(() => {
    if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id)
  }, [rows, selectedId])

  const guest = useMemo(() => {
    if (previewMode === 'invitado') {
      return rows.find((row) => row.id === selectedId) || rows[0] || SAMPLE
    }
    return SAMPLE
  }, [previewMode, rows, selectedId])

  const link = buildInviteUrl(guest.tarjeta, guest.pases)

  function updateField(key, value) {
    setDesign((current) => ({ ...current, [key]: value }))
    setSavedMsg('')
  }

  function handleSave() {
    saveCardDesign(design)
    setSavedMsg('Diseño guardado')
  }

  function handleReset() {
    if (!window.confirm('¿Volver al diseño inicial?')) return
    setDesign(resetCardDesign())
    setSavedMsg('Diseño restablecido')
  }

  async function handleExportPdf() {
    saveCardDesign(design)
    // Capturar exactamente lo que se ve en pantalla
    const target =
      stageRef.current?.querySelector('.phys-card') ||
      stageRef.current?.querySelector('.phys-closed') ||
      stageRef.current
    if (!target) {
      setSavedMsg('No se pudo generar el PDF')
      return
    }
    try {
      setExporting(true)
      setSavedMsg('Generando PDF…')
      const safeName = String(guest.tarjeta || 'muestra')
        .trim()
        .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, '')
        .replace(/\s+/g, '-')
        .slice(0, 40)
      await exportCardPdf(target, {
        filename: `tarjeta-kiara-${safeName || 'muestra'}.pdf`,
      })
      setSavedMsg('PDF descargado')
    } catch (error) {
      console.error(error)
      setSavedMsg('Error al exportar PDF')
    } finally {
      setExporting(false)
    }
  }

  const fields = [
    { key: 'centerKicker', label: 'Centro · etiqueta' },
    { key: 'centerName', label: 'Centro · nombre' },
    { key: 'centerSub', label: 'Centro · subtítulo' },
    { key: 'centerInvite', label: 'Centro · mensaje', multiline: true },
    { key: 'centerMeta', label: 'Centro · fecha/lugar', multiline: true },
    { key: 'centerNotes', label: 'Parte 4 · pool / sobres', multiline: true },
    { key: 'archKicker', label: 'Solapa · etiqueta' },
    { key: 'archScan', label: 'Solapa · texto bajo QR', multiline: true },
  ]

  return (
    <section className="phys">
      <div className="phys__intro no-print">
        <h2>Forma de la tarjeta</h2>
        <p>
          Diseño fijo: panel 1 nombre/cupos; panel 2 textos; panel 3 QR. Sin líneas de recorte.
        </p>
      </div>

      <div className="phys__toolbar no-print">
        <div className="phys__view-toggle" role="group" aria-label="Vista de la forma">
          <button
            type="button"
            className={view === 'abierta' ? 'is-active' : ''}
            onClick={() => setView('abierta')}
          >
            Abierta (3 paneles)
          </button>
          <button
            type="button"
            className={view === 'cerrada' ? 'is-active' : ''}
            onClick={() => setView('cerrada')}
          >
            Cerrada (solo arco)
          </button>
        </div>
        <button type="button" className="btn" onClick={handleSave}>
          Guardar diseño
        </button>
        <button
          type="button"
          className="btn"
          onClick={handleExportPdf}
          disabled={exporting}
        >
          {exporting ? 'Generando PDF…' : 'Descargar PDF'}
        </button>
      </div>

      {savedMsg ? <p className="registro__ok no-print">{savedMsg}</p> : null}

      <div className="phys__stage no-print" ref={stageRef}>
        {view === 'abierta' ? (
          <CardPreview design={design} guest={guest} link={link} />
        ) : (
          <ClosedPreview design={design} guest={guest} link={link} />
        )}
      </div>

      <details
        className="phys__editor-drawer no-print"
        open={editorOpen}
        onToggle={(event) => setEditorOpen(event.currentTarget.open)}
      >
        <summary>Editar textos y colores</summary>
        <form
          className="phys__editor"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <div className="phys__toolbar phys__toolbar--nested">
            <label>
              Vista previa con
              <select
                value={previewMode}
                onChange={(event) => setPreviewMode(event.target.value)}
              >
                <option value="muestra">Nombre de muestra</option>
                <option value="invitado">Invitado real</option>
              </select>
            </label>
            {previewMode === 'invitado' ? (
              <label>
                Invitado
                <select
                  value={guest?.id || ''}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={!rows.length}
                >
                  {rows.length === 0 ? (
                    <option value="">Crea tarjetas en Registro</option>
                  ) : (
                    rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.tarjeta} · {row.pases} cupos
                      </option>
                    ))
                  )}
                </select>
              </label>
            ) : null}
          </div>

          <div className="phys__fields">
            {fields.map((field) => (
              <label key={field.key}>
                {field.label}
                {field.multiline ? (
                  <textarea
                    rows={3}
                    value={design[field.key] ?? ''}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                ) : (
                  <input
                    value={design[field.key] ?? ''}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="phys__colors">
            <label>
              Color acento
              <input
                type="color"
                value={design.accent || DEFAULT_CARD_DESIGN.accent}
                onChange={(event) => updateField('accent', event.target.value)}
              />
            </label>
            <label>
              Color texto
              <input
                type="color"
                value={design.ink || DEFAULT_CARD_DESIGN.ink}
                onChange={(event) => updateField('ink', event.target.value)}
              />
            </label>
            <label>
              Color suave
              <input
                type="color"
                value={design.soft || DEFAULT_CARD_DESIGN.soft}
                onChange={(event) => updateField('soft', event.target.value)}
              />
            </label>
          </div>

          <div className="phys__editor-actions">
            <button type="submit" className="btn">
              Guardar diseño
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleReset}>
              Restablecer
            </button>
          </div>
        </form>
      </details>
    </section>
  )
}

function ClosedPreview({ design, guest, link }) {
  const style = {
    '--phys-accent': design.accent || DEFAULT_CARD_DESIGN.accent,
    '--phys-ink': design.ink || DEFAULT_CARD_DESIGN.ink,
    '--phys-soft': design.soft || DEFAULT_CARD_DESIGN.soft,
  }

  return (
    <div className="phys-closed" style={style}>
      <p className="phys-closed__caption">Cerrada: solapa 4.5 × 8 cm con arco</p>
      <ArchPanel design={design} guest={guest} link={link} qrSize={178} />
    </div>
  )
}

function PanelBg() {
  return <img className="phys-card__bg" src="/card-bg.png" alt="" draggable={false} />
}

function GuestPanel({ guest }) {
  const guestLayout = FIXED_GUEST_LAYOUT
  return (
    <aside className="phys-card__panel phys-card__panel--left phys-card__panel--guest-only phys-card__panel--piece">
      <PanelBg />
      <div
        className="phys-card__guest phys-card__guest--panel1"
        style={{
          left: `${guestLayout.x}cm`,
          bottom: `${guestLayout.bottom ?? 1.5}cm`,
          top: 'auto',
          width: `${guestLayout.w}cm`,
          transform: `rotate(${guestLayout.rotate}deg)`,
          '--guest-size': `${guestLayout.fontSize}rem`,
        }}
      >
        <strong>{guest.tarjeta}</strong>
        <span>
          {guest.pases} {guest.pases === 1 ? 'CUPO' : 'CUPOS'}
        </span>
      </div>
    </aside>
  )
}

function CenterPanel({ design }) {
  return (
    <main className="phys-card__panel phys-card__panel--center phys-card__panel--piece">
      <PanelBg />
      <div className="phys-card__part phys-card__part--1">
        <p className="phys-card__kicker">{design.centerKicker}</p>
        <h2 className="phys-card__name">{design.centerName}</h2>
        <p className="phys-card__sub">{design.centerSub}</p>
        <div className="phys-card__ornament" aria-hidden="true">
          <i />
          <span>✦</span>
          <i />
        </div>
      </div>

      <div className="phys-card__part phys-card__part--2">
        <p className="phys-card__invite">
          {String(design.centerInvite || '')
            .split('\n')
            .map((line, index, arr) => (
              <span key={`${line}-${index}`}>
                <span className="phys-card__nowrap">{line}</span>
                {index < arr.length - 1 ? <br /> : null}
              </span>
            ))}
        </p>
      </div>

      <div className="phys-card__part phys-card__part--3">
        <p className="phys-card__meta">
          {String(design.centerMeta || '')
            .split('\n')
            .map((line, index, arr) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < arr.length - 1 ? <br /> : null}
              </span>
            ))}
        </p>
      </div>

      <div className="phys-card__part phys-card__part--4">
        {String(design.centerNotes || '')
          .split('\n')
          .filter(Boolean)
          .map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
      </div>
    </main>
  )
}

function ArchPanel({ design, guest, link, qrSize = 170 }) {
  return (
    <aside className="phys-card__panel phys-card__panel--arch phys-card__panel--piece">
      <PanelBg />
      <p className="phys-card__kicker">{design.archKicker}</p>
      <div className="phys-card__qr-wrap">
        <CardQr link={link} tarjeta={guest.tarjeta} size={qrSize} showDownload={false} />
      </div>
      <p className="phys-card__scan">{design.archScan}</p>
    </aside>
  )
}

/** Vista previa unida (cómo se abre la tarjeta) */
export function CardPreview({ design, guest, link }) {
  const style = {
    '--phys-accent': design.accent || DEFAULT_CARD_DESIGN.accent,
    '--phys-ink': design.ink || DEFAULT_CARD_DESIGN.ink,
    '--phys-soft': design.soft || DEFAULT_CARD_DESIGN.soft,
  }

  return (
    <div className="phys-sheet" style={style}>
      <div className="phys-card" aria-label="Vista previa de tarjeta física">
        <GuestPanel guest={guest} />
        <CenterPanel design={design} />
        <ArchPanel design={design} guest={guest} link={link} />
      </div>
    </div>
  )
}

