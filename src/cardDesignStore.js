import { EVENT } from './invite'

const STORAGE_KEY = 'xv-kiara-card-design-v4-locked'
const LEGACY_KEYS = [
  'xv-kiara-card-design-v3',
  'xv-kiara-card-design-v2',
  'xv-kiara-card-design-v1',
]

/** Posición fija del panel 1 (fotos + nombre/pases). No cambiar sin pedirlo. */
export const FIXED_PHOTO_LAYOUT = [
  { id: 'p1', src: '/card-photo-1.jpg', x: 0.05, y: 0.15, w: 3.35, h: 3.45, rotate: -9, z: 1 },
  { id: 'p2', src: '/card-photo-2.jpg', x: 3.55, y: 1.85, w: 3.35, h: 3.45, rotate: 8, z: 2 },
  { id: 'p3', src: '/card-photo-3.jpg', x: 0.12, y: 4.1, w: 3.35, h: 3.45, rotate: -6.5, z: 3 },
  { id: 'p4', src: '/card-photo-4.jpg', x: 3.6, y: 5.9, w: 3.25, h: 3.3, rotate: 7, z: 4 },
]

export const FIXED_GUEST_LAYOUT = {
  x: 0.8,
  y: null,
  bottom: 1.5,
  w: 5.9,
  fontSize: 1.7,
  rotate: 0,
}

export const DEFAULT_PHOTOS = FIXED_PHOTO_LAYOUT.map((photo) => ({ ...photo }))
export const DEFAULT_GUEST_LAYOUT = { ...FIXED_GUEST_LAYOUT }

export const DEFAULT_CARD_DESIGN = {
  centerKicker: 'Mis XV años',
  centerName: EVENT.shortName,
  centerSub: 'Karyn Jhordana',
  centerInvite: 'Con mucho cariño\nte invito a celebrar\nmis 15 años.',
  centerMeta: `${EVENT.dateLong}\n${EVENT.timeLabel}\n${EVENT.venue}`,
  centerNotes: 'Pool party · piscina\nLluvia de sobres',

  archKicker: 'Confirma aquí',
  archScan:
    'Escanea el QR con tu celular para abrir tu invitación digital y confirmar asistencia.',

  accent: '#8f2d45',
  ink: '#1a3348',
  soft: '#3d5f7a',

  photos: DEFAULT_PHOTOS.map((photo) => ({ ...photo })),
  guestLayout: { ...DEFAULT_GUEST_LAYOUT },
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeCenterNotes(notes) {
  const value = String(notes || '').trim()
  if (
    !value ||
    value.includes('Trae ropa') ||
    value.includes('Tu presencia') ||
    value.includes('Pool party · Trae')
  ) {
    return DEFAULT_CARD_DESIGN.centerNotes
  }
  return value
}

function normalizeCenterInvite(invite) {
  const value = String(invite || '').trim()
  if (
    !value ||
    value === 'Con mucho cariño te invito a celebrar mis 15 años.' ||
    value === 'Con mucho cariño te invito a celebrar\nmis 15 años.'
  ) {
    return DEFAULT_CARD_DESIGN.centerInvite
  }
  return value
}

function normalizePhotos(photos) {
  if (!Array.isArray(photos)) {
    return FIXED_PHOTO_LAYOUT.map((photo) => ({ ...photo }))
  }
  return FIXED_PHOTO_LAYOUT.map((fallback, index) => ({
    ...fallback,
    ...(photos[index] || {}),
    id: fallback.id,
    src: fallback.src,
  }))
}

function normalizeDesign(parsed = {}) {
  const { centerMono: _removedMono, ...rest } = parsed
  return {
    ...DEFAULT_CARD_DESIGN,
    ...rest,
    centerNotes: normalizeCenterNotes(rest.centerNotes),
    centerInvite: normalizeCenterInvite(rest.centerInvite),
    archScan: normalizeArchScan(rest.archScan),
    photos: normalizePhotos(rest.photos),
    guestLayout: {
      ...FIXED_GUEST_LAYOUT,
      ...(rest.guestLayout || {}),
    },
  }
}

function normalizeArchScan(scan) {
  const value = String(scan || '').trim()
  if (
    !value ||
    value === 'Escanea el QR para abrir tu invitación digital y confirmar asistencia.'
  ) {
    return DEFAULT_CARD_DESIGN.archScan
  }
  return value
}

export function loadCardDesign() {
  try {
    const current = readJson(STORAGE_KEY)
    const legacy = LEGACY_KEYS.map(readJson).find(Boolean) || null
    const base = { ...(legacy || {}), ...(current || {}) }

    // Panel 1 siempre vuelve a la posición fija acordada.
    return normalizeDesign({
      ...base,
      photos: FIXED_PHOTO_LAYOUT.map((photo) => ({ ...photo })),
      guestLayout: { ...FIXED_GUEST_LAYOUT },
    })
  } catch {
    return normalizeDesign({})
  }
}

export function saveCardDesign(design) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
}

export function resetCardDesign() {
  localStorage.removeItem(STORAGE_KEY)
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
  return normalizeDesign({
    photos: FIXED_PHOTO_LAYOUT.map((photo) => ({ ...photo })),
    guestLayout: { ...FIXED_GUEST_LAYOUT },
  })
}
