import crypto from 'crypto'
import bcrypt from 'bcrypt'

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
  return (
    typeof value === 'string' &&
    (value.startsWith('scrypt$') || value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$'))
  )
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, storedValue) {
  if (!storedValue || typeof storedValue !== 'string') {
    return false
  }

  if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$') || storedValue.startsWith('$2y$')) {
    return bcrypt.compare(password, storedValue)
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
