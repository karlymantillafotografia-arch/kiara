import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, 'data')
const dataFile = path.join(dataDir, 'confirmaciones.json')

function newId() {
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readAll() {
  try {
    if (!fs.existsSync(dataFile)) return []
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeAll(rows) {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(dataFile, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
}

function buildInviteUrl(req, tarjeta, pases) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173'
  const proto = req.headers['x-forwarded-proto'] || 'http'
  const url = new URL(`${proto}://${host}/`)
  url.searchParams.set('para', String(tarjeta || '').trim())
  url.searchParams.set('pases', String(Number(pases) || 2))
  return url.toString()
}

function upsert(entry, req) {
  const rows = readAll()
  const tarjeta = String(entry.tarjeta || '').trim()
  if (!tarjeta) return { error: 'Falta el nombre de la tarjeta', status: 400 }

  const idx = rows.findIndex((row) => row.tarjeta.toLowerCase() === tarjeta.toLowerCase())
  const pases = Number(entry.pases) || 1
  const estado = ['si', 'no', 'pendiente'].includes(entry.estado) ? entry.estado : 'pendiente'
  const next = {
    id: idx >= 0 ? rows[idx].id : newId(),
    tarjeta,
    pases,
    estado,
    fecha: new Date().toISOString(),
    notas: entry.notas != null ? String(entry.notas) : idx >= 0 ? rows[idx].notas || '' : '',
    link: entry.link || (idx >= 0 && rows[idx].link) || buildInviteUrl(req, tarjeta, pases),
  }

  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)

  writeAll(rows)
  return { rows, row: next }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function mountApi(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname !== '/api/confirmaciones') {
      next()
      return
    }

    try {
      if (req.method === 'GET') {
        sendJson(res, 200, { rows: readAll() })
        return
      }

      if (req.method === 'POST') {
        const body = await readBody(req)
        const result = upsert(body, req)
        if (result.error) {
          sendJson(res, result.status, { error: result.error })
          return
        }
        sendJson(res, 200, result)
        return
      }

      if (req.method === 'DELETE') {
        const body = await readBody(req)
        const id = body.id
        if (!id) {
          sendJson(res, 400, { error: 'Falta id' })
          return
        }
        const rows = readAll().filter((row) => row.id !== id)
        writeAll(rows)
        sendJson(res, 200, { rows })
        return
      }

      sendJson(res, 405, { error: 'Método no permitido' })
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Error del servidor' })
    }
  })
}

export function rsvpApiPlugin() {
  return {
    name: 'rsvp-api',
    configureServer(server) {
      mountApi(server.middlewares)
    },
    configurePreviewServer(server) {
      mountApi(server.middlewares)
    },
  }
}
