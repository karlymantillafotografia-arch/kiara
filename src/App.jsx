import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EVENT,
  getInviteFromUrl,
  mapsEmbedUrl,
  mapsOpenUrl,
  passesLabel,
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

function PoolIcons() {
  return (
    <div className="pool__icons" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="pool__icon">
        <path
          d="M8 40c6 0 6-4 12-4s6 4 12 4 6-4 12-4 6 4 12 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M8 48c6 0 6-4 12-4s6 4 12 4 6-4 12-4 6 4 12 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M20 18c0-4 3-8 8-8s8 4 8 8c0 6-8 14-8 14s-8-8-8-14z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      <svg viewBox="0 0 64 64" className="pool__icon">
        <path
          d="M14 22h36v6c0 10-8 18-18 18S14 38 14 28v-6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path d="M22 22v-4a10 10 0 0 1 20 0v4" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 34h24M24 40h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 64 64" className="pool__icon">
        <circle cx="32" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M18 52c2-10 8-16 14-16s12 6 14 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M12 52h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 64 64" className="pool__icon">
        <rect
          x="12"
          y="18"
          width="40"
          height="28"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path d="M12 28h40M28 18v28" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="38" cy="38" r="3" fill="currentColor" />
      </svg>
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
      <p className="confirm__text">
        ¿Nos acompañas? Toca una opción y te abrirá WhatsApp con el mensaje listo para enviarnos.
      </p>
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
    requestAnimationFrame(() => {
      document.getElementById('contenido')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className={`app ${opened ? 'app--opened' : ''}`}>
      <div className="stage">
        <p className="stage__eyebrow">Mis XV años</p>
        <h1 className="stage__name">
          Kiara
          <span>Karyn Jhordana</span>
        </h1>

        <button
          type="button"
          className={`envelope ${opened ? 'envelope--open' : ''}`}
          onClick={openInvitation}
          aria-label="Abrir invitación"
          disabled={opened}
        >
          <span className="envelope__glow" aria-hidden="true" />
          <span className="envelope__shadow" />
          <span className="envelope__body">
            <span className="envelope__accent" aria-hidden="true" />
            <span className="envelope__liner" />
            <span className="envelope__address">
              <em>Para</em>
              <strong>{invite.para || 'ti'}</strong>
            </span>
          </span>
          <span className="envelope__flap" aria-hidden="true">
            <span className="envelope__flap-face" />
          </span>
          <span className="envelope__seal" aria-hidden="true">
            <span>{EVENT.monogram}</span>
          </span>
        </button>

        {!opened && <p className="stage__hint">Toca el sobre para abrir</p>}
      </div>

      <AnimatePresence>
        {opened && (
          <motion.div
            id="contenido"
            className="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
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
              {invite.para ? (
                <p className="passes__guest">
                  Invitación para <strong>{invite.para}</strong>
                </p>
              ) : (
                <p className="passes__guest">{passesLabel(invite.pases)} para esta invitación</p>
              )}
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
              <p className="details__stamp">{EVENT.dateLabel}</p>
              <p className="details__time">
                {EVENT.timeLabel}
                <span>Te pedimos puntualidad para disfrutar todo juntos</span>
              </p>

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
                <PoolIcons />
                <p className="pool__badge">Importante</p>
                <p className="pool__title">Pool party</p>
                <p className="pool__text">
                  Habrá piscina: no olvides traer <strong>ropa de baño</strong>, toalla y algo cómodo
                  para después.
                </p>
                <ul className="pool__list">
                  <li>Traje de baño</li>
                  <li>Toalla</li>
                  <li>Bloqueador</li>
                  <li>Cambio de ropa</li>
                </ul>
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
