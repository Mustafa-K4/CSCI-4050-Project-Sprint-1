import crypto from 'crypto'

function getPaymentKey() {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'change-this-payment-key'
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptPaymentData(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getPaymentKey(), iv)
  const data = typeof value === 'string' ? value : JSON.stringify(value)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function isEncryptedPaymentData(value) {
  return typeof value === 'string' && value.startsWith('enc:v1:')
}

export function decryptPaymentData(value) {
  if (!isEncryptedPaymentData(value)) {
    return value
  }

  const [, version, ivHex, authTagHex, encryptedHex] = value.split(':')
  if (version !== 'v1' || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted payment payload.')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getPaymentKey(),
    Buffer.from(ivHex, 'hex'),
  )
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')

  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }
}
