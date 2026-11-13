import { useEffect, useMemo, useState } from 'react'
import CardQr from './CardQr'
import TarjetaFisica from './TarjetaFisica'
import {
  buildInviteUrl,
  exportRegistrosCsv,
  formatFecha,
  inviteWhatsAppShareText,
  isRegistroUnlocked,
  lockRegistro,
  unlockRegistro,
} from './registroStore'
import { ENV } from './env'
import { createGuestPack } from './guestPack'
import {
  deleteConfirmacion,
  fetchConfirmaciones,
  saveConfirmacion,
  updateConfirmacion,
} from './rsvpApi'

const EMPTY_FORM = {
  tarjeta: '',
  pases: 2,
  notas: '',
  estado: 'pendiente',
}

export default function Registro() {
  const [unlocked, setUnlocked] = useState(() => isRegistroUnlocked())
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState('')
  const [editingOriginal, setEditingOriginal] = useState(null)
  const [copiedId, setCopiedId] = useState('')
  const [packBusyId, setPackBusyId] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('todas') // todas | si | no | pendiente
  const [tab, setTab] = useState('lista') // lista | diseno
  const isEditing = Boolean(editingId)

  const totals = useMemo(() => {
    const si = rows.filter((row) => row.estado === 'si')
    const no = rows.filter((row) => row.estado === 'no')
    const pendiente = rows.filter((row) => row.estado === 'pendiente')
    return {
      tarjetas: rows.length,
      si: si.length,
      no: no.length,
      pendiente: pendiente.length,
      pasesSi: si.reduce((sum, row) => sum + Number(row.pases || 0), 0),
    }
  }, [rows])

  const visibleRows = useMemo(() => {
    if (filter === 'todas') return rows
    return rows.filter((row) => row.estado === filter)
  }, [rows, filter])

  function selectFilter(next) {
    setFilter((current) => (current === next ? 'todas' : next))
  }

  const filterLabel =
    filter === 'si'
      ? 'Confirmaron Sí'
      : filter === 'no'
        ? 'Confirmaron No'
        : filter === 'pendiente'
          ? 'Pendientes'
          : 'Todas las tarjetas'

  async function refresh() {
    try {
      const next = await fetchConfirmaciones()
      setRows(next)
      setError('')
    } catch {
      setError('No se pudo cargar la tabla. ¿Está corriendo npm run dev?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!unlocked) return undefined
    refresh()
    const id = window.setInterval(refresh, 4000)
    return () => window.clearInterval(id)
  }, [unlocked])

  function handleUnlock(event) {
    event.preventDefault()
    if (!unlockRegistro(pin)) {
      setError('PIN incorrecto')
      return
    }
    setError('')
    setUnlocked(true)
  }

  function startEdit(row) {
    setEditingId(row.id)
    setEditingOriginal({
      tarjeta: row.tarjeta,
      pases: row.pases,
      notas: row.notas || '',
      estado: row.estado || 'pendiente',
    })
    setForm({
      tarjeta: row.tarjeta,
      pases: row.pases,
      notas: row.notas || '',
      estado: row.estado || 'pendiente',
    })
    setError('')
    setOkMsg(`Editando: ${row.tarjeta}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId('')
    setEditingOriginal(null)
    setForm(EMPTY_FORM)
    setError('')
    setOkMsg('')
  }

  async function handleCreateCard(event) {
    event.preventDefault()
    const tarjeta = form.tarjeta.trim()
    if (!tarjeta) {
      setError('Escribe el nombre de la tarjeta')
      setOkMsg('')
      return
    }

    const pases = form.pases
    const notas = form.notas
    const estado = form.estado || 'pendiente'

    try {
      setCreating(true)

      if (isEditing) {
        const link = buildInviteUrl(tarjeta, pases)
        const data = await updateConfirmacion(editingId, {
          tarjeta,
          pases,
          notas,
          estado,
          link,
        })
        setRows(data.rows || [])
        setError('')

        const nameChanged =
          editingOriginal &&
          editingOriginal.tarjeta.trim().toLowerCase() !== tarjeta.toLowerCase()
        const pasesChanged = editingOriginal && Number(editingOriginal.pases) !== Number(pases)
        const needsPack = nameChanged || pasesChanged

        if (needsPack) {
          const regen = window.confirm(
            'Cambiaste el nombre o los cupos. ¿Regenerar QR y PDF con los datos nuevos?',
          )
          if (regen) {
            setOkMsg(`Actualizando QR y PDF de ${tarjeta}…`)
            await createGuestPack(tarjeta, pases)
            setOkMsg(`Tarjeta actualizada y QR + PDF regenerados (${tarjeta})`)
          } else {
            setOkMsg(
              `Tarjeta actualizada (${tarjeta}). Si ya imprimiste el QR, regenera el paquete desde la tabla.`,
            )
          }
        } else {
          setOkMsg(`Tarjeta actualizada (${tarjeta})`)
        }

        setEditingId('')
        setEditingOriginal(null)
        setForm(EMPTY_FORM)
        return
      }

      const link = buildInviteUrl(tarjeta, pases)
      const shareText = inviteWhatsAppShareText(tarjeta, pases)
      const data = await saveConfirmacion({
        tarjeta,
        pases,
        notas,
        estado: 'pendiente',
        link,
      })
      setRows(data.rows || [])
      setForm(EMPTY_FORM)
      setError('')
      setOkMsg(`Creando QR e invitación física de ${tarjeta}…`)

      await createGuestPack(tarjeta, pases)
      const copied = await copyText(shareText)
      setOkMsg(
        copied
          ? `Listo: QR + PDF físico + enlace digital copiado (${tarjeta})`
          : `QR y PDF listos para ${tarjeta}. Copia el enlace desde la tabla.`,
      )
    } catch (err) {
      setError(err.message || (isEditing ? 'No se pudo actualizar la tarjeta' : 'No se pudo crear la tarjeta'))
      setOkMsg('')
    } finally {
      setCreating(false)
    }
  }

  async function handleDownloadPack(row) {
    try {
      setPackBusyId(row.id)
      setError('')
      await createGuestPack(row.tarjeta, row.pases)
      setOkMsg(`Descargados QR + PDF de ${row.tarjeta}`)
    } catch (err) {
      setError(err.message || 'No se pudo descargar el paquete')
    } finally {
      setPackBusyId('')
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      window.prompt('Copia este enlace:', text)
      return false
    }
  }

  async function handleCopyLink(row) {
    const shareText = inviteWhatsAppShareText(row.tarjeta, row.pases)
    const copied = await copyText(shareText)
    if (copied) {
      setCopiedId(row.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este registro?')) return
    try {
      const data = await deleteConfirmacion(id)
      setRows(data.rows || [])
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    }
  }

  function handleExport() {
    const csv = exportRegistrosCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `registro-xv-kiara-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleLock() {
    lockRegistro()
    setUnlocked(false)
    setPin('')
  }

  if (!unlocked) {
    return (
      <div className="registro">
        <div className="registro__card">
          <p className="registro__eyebrow">Privado</p>
          <h1>Registro de confirmaciones</h1>
          <p className="registro__hint">
            Las respuestas de Sí / No se guardan solas en esta tabla cuando confirman.
          </p>
          <form className="registro__pin" onSubmit={handleUnlock}>
            <label htmlFor="registro-pin">PIN</label>
            <input
              id="registro-pin"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              autoComplete="current-password"
              placeholder="kiara15"
            />
            <button type="submit" className="btn">
              Entrar
            </button>
            {error ? <p className="registro__error">{error}</p> : null}
          </form>
          <a className="registro__back" href="./">
            Volver a la invitación
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="registro registro--open">
      <header className="registro__header">
        <div>
          <p className="registro__eyebrow">XV Kiara</p>
          <h1>{tab === 'diseno' ? 'Diseño tarjeta física' : 'Registro por tarjeta'}</h1>
          <p className="registro__live">
            {tab === 'diseno'
              ? 'Plantilla con la forma del boceto y QR por invitado'
              : 'Se actualiza sola cada pocos segundos'}
          </p>
        </div>
        <div className="registro__header-actions">
          <button type="button" className="btn btn--ghost" onClick={refresh}>
            Actualizar
          </button>
          {tab === 'lista' ? (
            <button type="button" className="btn btn--ghost" onClick={handleExport}>
              Exportar CSV
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={handleLock}>
            Cerrar
          </button>
        </div>
      </header>

      <nav className="registro__tabs no-print" aria-label="Secciones del registro">
        <button
          type="button"
          className={tab === 'lista' ? 'is-active' : ''}
          onClick={() => setTab('lista')}
        >
          Registro
        </button>
        <button
          type="button"
          className={tab === 'diseno' ? 'is-active' : ''}
          onClick={() => setTab('diseno')}
        >
          Diseño físico
        </button>
      </nav>

      {tab === 'diseno' ? <TarjetaFisica rows={rows} /> : null}

      {tab === 'lista' ? (
        <>
      <section className="registro__howto">
        <h2>Una creación = tres cosas</h2>
        <ol>
          <li>
            <strong>Invitación digital:</strong> se guarda el registro y se copia el mensaje con
            enlace personalizado.
          </li>
          <li>
            <strong>QR:</strong> se descarga el PNG para imprimir o pegar.
          </li>
          <li>
            <strong>Tarjeta física:</strong> se descarga el PDF con el diseño fijo (nombre, cupos y
            QR del invitado).
          </li>
          <li>
            Al escanear el QR abren su invitación y confirman; la tabla se actualiza sola.
          </li>
        </ol>
        <p className="registro__ok">Enlace público: {ENV.publicInviteUrl}</p>
      </section>

      <section className="registro__stats" aria-label="Filtrar por estado">
        <button
          type="button"
          className={filter === 'todas' ? 'is-active' : ''}
          onClick={() => setFilter('todas')}
        >
          <strong>{totals.tarjetas}</strong>
          <span>Tarjetas</span>
        </button>
        <button
          type="button"
          className={filter === 'si' ? 'is-active' : ''}
          onClick={() => selectFilter('si')}
        >
          <strong>{totals.si}</strong>
          <span>Sí</span>
        </button>
        <button
          type="button"
          className={filter === 'no' ? 'is-active' : ''}
          onClick={() => selectFilter('no')}
        >
          <strong>{totals.no}</strong>
          <span>No</span>
        </button>
        <button
          type="button"
          className={filter === 'pendiente' ? 'is-active' : ''}
          onClick={() => selectFilter('pendiente')}
        >
          <strong>{totals.pendiente}</strong>
          <span>Pendiente</span>
        </button>
        <button
          type="button"
          className={filter === 'si' ? 'is-active' : ''}
          onClick={() => selectFilter('si')}
          title="Ver tarjetas que confirmaron sí"
        >
          <strong>{totals.pasesSi}</strong>
          <span>Cupos sí</span>
        </button>
      </section>
      <p className="registro__filter-label">
        Mostrando: <strong>{filterLabel}</strong>
        {filter !== 'todas' ? (
          <button type="button" className="registro__filter-clear" onClick={() => setFilter('todas')}>
            Ver todas
          </button>
        ) : null}
      </p>

      <form className="registro__form" onSubmit={handleCreateCard}>
        <h2>{isEditing ? 'Editar tarjeta' : 'Crear tarjeta (QR + digital + física)'}</h2>
        {isEditing ? (
          <p className="registro__hint">
            Corrige el nombre, cupos, notas o confirmación. Si cambias nombre o cupos, puedes
            regenerar el QR y el PDF.
          </p>
        ) : null}
        <div className="registro__fields">
          <label>
            Nombre de la tarjeta
            <input
              value={form.tarjeta}
              onChange={(event) => setForm({ ...form, tarjeta: event.target.value })}
              placeholder="Familia Morales"
              required
              disabled={creating}
            />
          </label>
          <label>
            Cupos
            <input
              type="number"
              min="1"
              max="12"
              value={form.pases}
              onChange={(event) => setForm({ ...form, pases: Number(event.target.value) || 1 })}
              disabled={creating}
            />
          </label>
          {isEditing ? (
            <label>
              Confirmación
              <select
                value={form.estado}
                onChange={(event) => setForm({ ...form, estado: event.target.value })}
                disabled={creating}
              >
                <option value="pendiente">Pendiente</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
          ) : null}
          <label className="registro__notes">
            Notas
            <input
              value={form.notas}
              onChange={(event) => setForm({ ...form, notas: event.target.value })}
              placeholder="Opcional"
              disabled={creating}
            />
          </label>
        </div>
        {error ? <p className="registro__error">{error}</p> : null}
        {okMsg ? <p className="registro__ok">{okMsg}</p> : null}
        <div className="registro__form-actions">
          <button type="submit" className="btn" disabled={creating}>
            {creating
              ? isEditing
                ? 'Guardando…'
                : 'Generando QR y PDF…'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear tarjeta (QR + digital + física)'}
          </button>
          {isEditing ? (
            <button
              type="button"
              className="btn btn--ghost"
              disabled={creating}
              onClick={cancelEdit}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="registro__table-wrap">
        <table className="registro__table">
          <thead>
            <tr>
              <th>Tarjeta</th>
              <th>Cupos</th>
              <th>Confirmación</th>
              <th>QR (físico)</th>
              <th>Enlace</th>
              <th>Fecha</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="registro__empty">
                  Cargando confirmaciones…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="registro__empty">
                  Aún no hay tarjetas. Crea una arriba y aparecerá aquí como Pendiente.
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="registro__empty">
                  No hay tarjetas en “{filterLabel}”.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const link = buildInviteUrl(row.tarjeta, row.pases)
                return (
                  <tr key={row.id}>
                    <td data-label="Tarjeta">
                      <strong>{row.tarjeta}</strong>
                      {row.notas ? <div className="registro__note-line">{row.notas}</div> : null}
                    </td>
                    <td data-label="Cupos">{row.pases}</td>
                    <td data-label="Confirmación">
                      <span className={`registro__badge registro__badge--${row.estado}`}>
                        {row.estado === 'si' ? 'Sí' : row.estado === 'no' ? 'No' : 'Pendiente'}
                      </span>
                    </td>
                    <td data-label="QR">
                      <CardQr link={link} tarjeta={row.tarjeta} />
                    </td>
                    <td data-label="Enlace">
                      <button
                        type="button"
                        className="registro__copy"
                        onClick={() => handleCopyLink(row)}
                      >
                        {copiedId === row.id ? 'Copiado' : 'Copiar enlace'}
                      </button>
                      <button
                        type="button"
                        className="registro__copy"
                        onClick={() => handleDownloadPack(row)}
                        disabled={packBusyId === row.id}
                      >
                        {packBusyId === row.id ? 'Generando…' : 'QR + PDF'}
                      </button>
                      <div className="registro__link-preview">{link}</div>
                    </td>
                    <td data-label="Fecha">{formatFecha(row.fecha)}</td>
                    <td>
                      <div className="registro__row-actions">
                        <button
                          type="button"
                          className="registro__edit"
                          onClick={() => startEdit(row)}
                          disabled={creating || editingId === row.id}
                        >
                          {editingId === row.id ? 'Editando…' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          className="registro__delete"
                          onClick={() => handleDelete(row.id)}
                          disabled={creating || editingId === row.id}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : null}

      <a className="registro__back no-print" href="./">
        Volver a la invitación
      </a>
    </div>
  )
}
