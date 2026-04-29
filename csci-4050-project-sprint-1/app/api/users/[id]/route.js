import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { getSessionUser, toSafeUser } from '../../../../lib/auth/current-user'
import { sendProfileChangeEmail } from '../../../../lib/auth/email'
import { verifyPassword } from '../../../../lib/auth/passwords'
import { decryptPaymentData, encryptPaymentData } from '../../../../lib/security/encryption'
import {
  isEmptyPaymentCard,
  normalizePaymentCard,
  validatePaymentCard,
} from '../../../../lib/security/payment-card'

function normalizeAddress(address) {
  const value = typeof address === 'string' ? address.trim() : ''
  return value ? [value] : []
}

function createValidationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

function normalizeIncomingCards(cards) {
  if (!Array.isArray(cards)) {
    return []
  }

  const normalizedCards = cards
    .map(normalizePaymentCard)
    .filter((card) => !isEmptyPaymentCard(card))

  if (normalizedCards.length > 3) {
    throw createValidationError('You can store a maximum of 3 payment cards.')
  }

  const invalidCard = normalizedCards
    .map((card, index) => ({
      index,
      error: validatePaymentCard(card),
    }))
    .find((result) => result.error)

  if (invalidCard) {
    throw createValidationError(`Card ${invalidCard.index + 1}: ${invalidCard.error}`)
  }

  return normalizedCards
}

function normalizeStoredCards(payments) {
  if (!Array.isArray(payments)) {
    return []
  }

  return payments
    .map((payment) => {
      try {
        const value = decryptPaymentData(payment)
        if (!value || typeof value !== 'object') {
          return null
        }

        return normalizePaymentCard(value)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function normalizeFavoriteItem(item) {
  if (!item) {
    return null
  }

  if (typeof item === 'string') {
    const movieId = item.trim()
    return movieId ? { movieId } : null
  }

  if (typeof item !== 'object') {
    return null
  }

  const movieId = String(item.movieId || item._id || item.id || '').trim()
  if (!movieId) {
    return null
  }

  return {
    movieId,
    title: item.title || item.name || '',
    genre: item.genre || '',
    rating: item.rating || '',
    poster_url: item.poster_url || item.posterUrl || '',
  }
}

function buildUserPayload(user) {
  const paymentCards = normalizeStoredCards(user.payments)
  const favoriteMovies = Array.isArray(user.favorites)
    ? user.favorites.map(normalizeFavoriteItem).filter(Boolean)
    : []

  return {
    ...toSafeUser(user),
    payments: paymentCards,
    paymentCards,
    favorites: favoriteMovies,
    favoriteMovies,
  }
}

function isSameUser(sessionUser, id) {
  return sessionUser?._id?.toString() === id
}

export async function GET(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })
    }

    if (!isSameUser(sessionUser, id) && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    await dbConnect()
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: buildUserPayload(user) }, { status: 200 })
  } catch (error) {
    console.error('User profile GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to load user profile.' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })
    }

    if (!isSameUser(sessionUser, id) && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    await dbConnect()
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const body = await request.json()
    const nextName = String(body.name || '').trim()
    const nextAddress = normalizeAddress(body.address)
    const nextEmail = String(body.email || '').trim().toLowerCase()
    const currentPassword = String(body.currentPassword || '')
    const hasPaymentCardsPayload =
      Object.prototype.hasOwnProperty.call(body, 'paymentCards') ||
      Object.prototype.hasOwnProperty.call(body, 'payments')

    if (!nextName) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
    }

    if (nextEmail && nextEmail !== String(user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'Email address cannot be changed.' }, { status: 400 })
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.pswrd)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    const previousCards = normalizeStoredCards(user.payments)
    const paymentCards = hasPaymentCardsPayload
      ? normalizeIncomingCards(body.paymentCards || body.payments || [])
      : previousCards
    const changedFields = []

    if (user.name !== nextName) {
      user.name = nextName
      changedFields.push('name')
    }

    const currentAddress = Array.isArray(user.address) ? user.address : []
    if (JSON.stringify(currentAddress) !== JSON.stringify(nextAddress)) {
      user.address = nextAddress
      changedFields.push('address')
    }

    if (hasPaymentCardsPayload && JSON.stringify(previousCards) !== JSON.stringify(paymentCards)) {
      user.payments = paymentCards.map((card) => encryptPaymentData(card))
      user.no_payments = String(paymentCards.length)
      changedFields.push('payment cards')
    }

    await user.save()

    let emailWarning = ''
    if (changedFields.length > 0) {
      try {
        await sendProfileChangeEmail({
          to: user.email,
          name: user.name,
          changedFields,
        })
      } catch (emailError) {
        emailWarning = emailError.message || 'Profile updated, but the email notification could not be sent.'
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: emailWarning || 'Profile updated successfully.',
        user: buildUserPayload(user),
        emailWarning,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('User profile PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to update user profile.' },
      { status: error.statusCode || 500 }
    )
  }
}
