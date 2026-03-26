import crypto from 'crypto'

export const SESSION_COOKIE_NAME = 'cinema_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

const DEFAULT_SECRET = 'change-this-auth-secret-for-production'

function getSessionSecret() {
  return process.env.AUTH_SECRET || DEFAULT_SECRET
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function createSignature(payloadSegment) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadSegment)
    .digest('base64url')
}

export function createSessionToken(payload) {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: nowInSeconds,
    exp: nowInSeconds + SESSION_MAX_AGE_SECONDS,
  }
  const payloadSegment = toBase64Url(JSON.stringify(body))
  const signature = createSignature(payloadSegment)
  return `${payloadSegment}.${signature}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  const [payloadSegment, signature] = token.split('.')
  if (!payloadSegment || !signature) {
    return null
  }

  const expectedSignature = createSignature(payloadSegment)
  const left = Buffer.from(signature)
  const right = Buffer.from(expectedSignature)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < nowInSeconds) {
    return null
  }

  return payload
}
