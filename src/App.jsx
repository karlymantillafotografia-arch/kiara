import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EVENT,
  getInviteFromUrl,
  mapsEmbedUrl,
  mapsOpenUrl,
  whatsappConfirmUrl,
} from './invite'
import './App.css'

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
  function openWhatsApp(attending) {
    const url = whatsappConfirmUrl({
      attending,
      para: invite.para,
      pases: invite.pases,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="confirm">
      <div className="confirm__text">
        <p>
          Confirma tu asistencia antes del <strong>martes 17 de noviembre</strong> para reservar tus
          pases. Después de esta fecha, no podremos asegurarlos.
        </p>
      </div>
      <div className="confirm__actions">
        <button type="button" className="btn" onClick={() => openWhatsApp(true)}>
          Sí, ahí estaré
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => openWhatsApp(false)}>
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
  const [opened, setOpened] = useState(false)

  function openInvitation() {
    setOpened(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`app ${opened ? 'app--opened' : 'app--cover'}`}>
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section
            key="cover"
            className="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cover__bg" aria-hidden="true">
              <span className="cover__glow" />
              <span className="cover__fold cover__fold--tl" />
              <span className="cover__fold cover__fold--br" />
              <span className="cover__fold cover__fold--blue" />
            </div>

            <div className="cover__content">
              <p className="cover__eyebrow">Mis XV años</p>
              <h1 className="cover__title">
                Kiara
                <span>Karyn Jhordana</span>
              </h1>
              <div className="cover__rule" aria-hidden="true">
                <i />
                <em>✦</em>
                <i />
              </div>

              <button
                type="button"
                className="cover-envelope"
                onClick={openInvitation}
                aria-label="Toca el sobre para abrir la invitación"
              >
                <span className="cover-envelope__shade" />
                <span className="cover-envelope__back" />
                <span className="cover-envelope__liner" />
                <span className="cover-envelope__pocket">
                  {invite.para ? (
                    <span className="cover-envelope__guest">
                      Para <strong>{invite.para}</strong>
                    </span>
                  ) : null}
                </span>
                <span className="cover-envelope__wing cover-envelope__wing--l" />
                <span className="cover-envelope__wing cover-envelope__wing--r" />
                <span className="cover-envelope__flap" />
                <span className="cover-envelope__spark cover-envelope__spark--1">✦</span>
                <span className="cover-envelope__spark cover-envelope__spark--2">✦</span>
                <span className="cover-envelope__spark cover-envelope__spark--3">✦</span>
                <span className="cover-envelope__spark cover-envelope__spark--4">✦</span>
                <span className="cover-envelope__seal">
                  <span className="cover-envelope__seal-ring" />
                  <span className="cover-envelope__seal-glow" />
                  <span className="cover-envelope__seal-mark">
                    <i>✦</i>
                    <b>{EVENT.monogram}</b>
                    <i>✦</i>
                  </span>
                </span>
              </button>

              <p className="cover__cta">
                <span />
                Toca el sobre para abrir
                <span />
              </p>
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
