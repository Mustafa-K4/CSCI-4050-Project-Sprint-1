import crypto from 'crypto'

const KEY_LENGTH = 64

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }
      resolve(derivedKey)
    })
  })
}

export function validatePasswordStrength(password) {
  const value = typeof password === 'string' ? password : ''
  if (value.length < 8) {
    return 'Password must be at least 8 characters long.'
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must include uppercase, lowercase, and a number.'
  }
  return null
}

export function isHashedPassword(value) {
  return typeof value === 'string' && value.startsWith('scrypt$')
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt)
  return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password, storedValue) {
  if (!storedValue || typeof storedValue !== 'string') {
    return false
  }

  if (!isHashedPassword(storedValue)) {
    return storedValue === password
  }

  const [, salt, hashHex] = storedValue.split('$')
  if (!salt || !hashHex) {
    return false
  }

  const incomingHash = await scrypt(password, salt)
  const storedHash = Buffer.from(hashHex, 'hex')

  if (storedHash.length !== incomingHash.length) {
    return false
  }

  return crypto.timingSafeEqual(storedHash, incomingHash)
}
