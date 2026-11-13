import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EVENT,
  getInviteFromUrl,
  mapsEmbedUrl,
  mapsOpenUrl,
  whatsappConfirmUrl,
} from './invite'
import Registro from './Registro.jsx'
import { saveConfirmacion } from './rsvpApi'
import './App.css'

const BG_MUSIC_SRC = '/bg-music.mp3'
const BG_MUSIC_VOLUME = 0.42

function getRemaining(now) {
  const diff = Math.max(0, EVENT.datetime.getTime() - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function Countdown() {
  const [time, setTime] = useState(() => getRemaining(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const cells = [
    { value: time.days, label: 'Días' },
    { value: time.hours, label: 'Horas' },
    { value: time.minutes, label: 'Min' },
    { value: time.seconds, label: 'Seg' },
  ]

  return (
    <div className="countdown" aria-live="polite">
      {cells.map((cell) => (
        <div className="countdown__cell" key={cell.label}>
          <span className="countdown__num">{String(cell.value).padStart(2, '0')}</span>
          <span className="countdown__unit">{cell.label}</span>
        </div>
      ))}
    </div>
  )
}

function PoolScene() {
  return (
    <div className="pool-scene" aria-hidden="true">
      <video
        className="pool-scene__video"
        src="/pool-party.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  )
}

function ConfirmBlock({ invite }) {
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const tarjeta = (invite.para || '').trim() || 'Sin nombre en tarjeta'

  async function openWhatsApp(attending) {
    setSaving(true)
    setStatus('Guardando confirmación…')

    try {
      await saveConfirmacion({
        tarjeta,
        pases: invite.pases,
        estado: attending ? 'si' : 'no',
      })
      setStatus(
        attending
          ? 'Confirmación registrada. Abriendo WhatsApp…'
          : 'Respuesta registrada. Abriendo WhatsApp…',
      )
    } catch {
      setStatus('No se pudo guardar en la tabla, pero puedes confirmar por WhatsApp.')
    }

    const url = whatsappConfirmUrl({
      attending,
      para: tarjeta,
      pases: invite.pases,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setSaving(false)
  }

  return (
    <div className="confirm">
      <div className="confirm__text">
        <p>
          Confirma tu asistencia antes del <strong>martes 17 de noviembre</strong> para reservar tus
          pases. Después de esta fecha, no podremos asegurarlos.
        </p>
      </div>
      {status ? <p className="confirm__status">{status}</p> : null}
      <div className="confirm__actions">
        <button type="button" className="btn" disabled={saving} onClick={() => openWhatsApp(true)}>
          Sí, ahí estaré
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={saving}
          onClick={() => openWhatsApp(false)}
        >
          No podré ir
        </button>
      </div>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.12 + i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function App() {
  const invite = useMemo(() => getInviteFromUrl(), [])
  const isRegistro = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('registro') === '1' || window.location.hash === '#registro'
  }, [])
  const [opened, setOpened] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    audio.volume = BG_MUSIC_VOLUME
    audio.loop = true
    return () => {
      audio.pause()
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !opened) return
    if (musicOn) {
      audio.play().catch(() => {
        setMusicOn(false)
      })
    } else {
      audio.pause()
    }
  }, [opened, musicOn])

  function openInvitation() {
    setOpened(true)
    setMusicOn(true)
    const audio = audioRef.current
    if (audio) {
      audio.volume = BG_MUSIC_VOLUME
      audio.play().catch(() => {
        setMusicOn(false)
      })
    }
    // Deja que el layout abierto monte y luego ancla arriba sin pelear con el scroll.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }

  if (isRegistro) {
    return <Registro />
  }

  return (
    <div className={`app ${opened ? 'app--opened' : 'app--cover'}`}>
      <audio ref={audioRef} src={BG_MUSIC_SRC} preload="auto" loop />

      {opened ? (
        <div className="page-scape" aria-hidden="true">
          <span className="page-scape__wash" />
          <span className="page-scape__orb page-scape__orb--blue" />
          <span className="page-scape__orb page-scape__orb--wine" />
          <span className="page-scape__orb page-scape__orb--mist" />
          <span className="page-scape__curve page-scape__curve--tl" />
          <span className="page-scape__curve page-scape__curve--br" />
          <span className="page-scape__spark page-scape__spark--1">✦</span>
          <span className="page-scape__spark page-scape__spark--2">✦</span>
          <span className="page-scape__spark page-scape__spark--3">✦</span>
          <span className="page-scape__spark page-scape__spark--4">✦</span>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section
            key="cover"
            className="cover cover--scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cover__frame">
              <img
                className="cover__scene"
                src="/cover-scene.jpg"
                alt=""
                aria-hidden="true"
                draggable={false}
              />

              {invite.para ? (
                <p className="cover__guest">
                  Para <strong>{invite.para}</strong>
                </p>
              ) : null}

              <button
                type="button"
                className="cover-seal"
                onClick={openInvitation}
                aria-label="Toca el sello para abrir la invitación"
              >
                <img src="/seal-km.png" alt="" draggable={false} />
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="content"
            id="contenido"
            className="content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.section
              className="passes"
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="passes__seal" aria-hidden="true">
                {EVENT.monogram}
              </div>
              <p className="passes__kicker">Hemos reservado</p>
              <div className="passes__dots" aria-hidden="true">
                {Array.from({ length: invite.pases }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
              <h2 className="passes__title">
                ({invite.pases}) {invite.pases === 1 ? 'pase' : 'pases'} en su honor
              </h2>
              <div className="passes__family">
                <p className="passes__family-label">Invitados</p>
                <p className={`passes__family-name ${invite.para ? '' : 'is-empty'}`}>
                  {invite.para || 'Nombre de la familia o invitados'}
                </p>
              </div>
            </motion.section>

            <motion.section
              className="intro"
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="intro__photo">
                <img src="/kiara.png" alt={EVENT.name} />
                <div className="intro__gradient" aria-hidden="true" />
              </div>
              <div className="intro__copy">
                <p className="intro__label">Con mucho cariño</p>
                <h2 className="intro__title">Te espero en mis XV</h2>
                <p className="intro__message">
                  Me alegraría profundamente que me acompañaras a celebrar mis 15 años. Tu presencia
                  hará de este día un recuerdo todavía más especial, lleno de alegría, baile y
                  momentos que quiero compartir contigo.
                </p>
                <p className="intro__sign">{EVENT.name}</p>
              </div>
            </motion.section>

            <motion.section
              className="details"
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <p className="details__label">El gran día</p>
              <h2 className="details__date">{EVENT.dateLong}</h2>
              <p className="details__time">
                {EVENT.timeLabel}
                <span>Te pedimos puntualidad para disfrutar todo juntos</span>
              </p>

              <p className="details__countdown-label">Quedan</p>
              <Countdown />

              <div className="details__venue">
                <p className="details__label">Lugar</p>
                <h3>{EVENT.venue}</h3>
              </div>

              <div className="map">
                <iframe
                  title="Ubicación Estadero Las Margaritas"
                  src={mapsEmbedUrl()}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a className="btn" href={mapsOpenUrl()} target="_blank" rel="noreferrer">
                Abrir en Google Maps
              </a>

              <div className="pool">
                <PoolScene />
                <div className="pool__copy">
                  <p className="pool__title">Pool party</p>
                  <p className="pool__text">
                    Habrá piscina: no olvides traer <strong>ropa de baño</strong>, toalla y algo
                    cómodo para después.
                  </p>
                </div>
              </div>

              <div className="gift" aria-label="Lluvia de sobres">
                <img
                  className="gift__bg"
                  src="/lluvia-sobres.gif"
                  alt=""
                  aria-hidden="true"
                />
                <div className="gift__frame" aria-hidden="true" />
                <div className="gift__copy">
                  <span className="gift__mark">✦</span>
                  <p className="gift__label">Lluvia de sobres</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="rsvp"
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="rsvp__photo">
                <img src="/kiara-confirm.png" alt={EVENT.name} />
                <div className="rsvp__photo-fade" aria-hidden="true" />
              </div>
              <div className="rsvp__body">
                <p className="details__label">Confirmación</p>
                <h2 className="rsvp__title">¿Nos acompañas?</h2>
                <ConfirmBlock invite={invite} />
              </div>
            </motion.section>

            <p className="footer">
              Con cariño, <span>{EVENT.shortName}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
