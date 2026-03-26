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
