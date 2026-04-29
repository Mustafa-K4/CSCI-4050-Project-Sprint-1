export function normalizeCardNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function normalizeExpirationInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function normalizeCvvInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 4)
}

export function normalizePaymentCard(card) {
  return {
    cardholderName: String(card?.cardholderName || '').trim(),
    cardNumber: normalizeCardNumberInput(card?.cardNumber),
    expirationDate: normalizeExpirationInput(card?.expirationDate),
    cvv: normalizeCvvInput(card?.cvv),
  }
}

export function isEmptyPaymentCard(card) {
  const normalized = normalizePaymentCard(card)
  return !normalized.cardholderName && !normalized.cardNumber && !normalized.expirationDate && !normalized.cvv
}

export function isValidExpirationDate(value) {
  const match = String(value || '').match(/^(0[1-9]|1[0-2])\/(\d{2})$/)
  if (!match) return false

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return year > currentYear || (year === currentYear && month >= currentMonth)
}

export function validatePaymentCard(card, options = {}) {
  const normalized = normalizePaymentCard(card)
  const requireCardholderName = Boolean(options.requireCardholderName)
  const cardDigits = normalized.cardNumber.replace(/\D/g, '')

  if (requireCardholderName && normalized.cardholderName.length < 2) {
    return 'Cardholder name must be at least 2 characters.'
  }

  if (cardDigits.length !== 16) {
    return 'Card number must contain exactly 16 digits.'
  }

  if (!isValidExpirationDate(normalized.expirationDate)) {
    return 'Expiration date must be a valid future date in MM/YY format.'
  }

  if (!/^\d{3,4}$/.test(normalized.cvv)) {
    return 'CVV must contain 3 or 4 digits.'
  }

  return ''
}
