import dbConnect from '../../../../database/db'
import User from '../../../../models/user'

function normalizeCards(cardsInput) {
  if (!Array.isArray(cardsInput)) return []

  return cardsInput.map(card => ({
    cardNumber: String(card?.cardNumber || '').trim(),
    expirationDate: String(card?.expirationDate || '').trim(),
    cvv: String(card?.cvv || '').trim(),
  }))
}

function hasIncompleteCard(card) {
  return !card.cardNumber || !card.expirationDate || !card.cvv
}

function normalizeFavoriteMovies(favoritesInput) {
  if (!Array.isArray(favoritesInput)) return []

  return favoritesInput
    .map(item => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') return item
      return null
    })
    .filter(Boolean)
}

export async function GET(request, { params }) {
  try {
    await dbConnect()

    const id = params?.id
    const user = await User.findById(id).select('-password')

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return Response.json({ success: true, user }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user by id:', error)
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch user' },
      { status: 500 },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const id = params?.id
    const body = await request.json()

    const existingUser = await User.findById(id)

    if (!existingUser) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (
      body.email !== undefined &&
      String(body.email).trim().toLowerCase() !== String(existingUser.email).trim().toLowerCase()
    ) {
      return Response.json(
        { success: false, error: 'Email cannot be updated' },
        { status: 400 },
      )
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const incomingAddress = Array.isArray(body.address)
      ? body.address.map(item => String(item || '').trim()).filter(Boolean)
      : typeof body.address === 'string' && body.address.trim()
        ? [body.address.trim()]
        : []

    const paymentCardsInput = body.paymentCards !== undefined ? body.paymentCards : body.payments
    const paymentCards = normalizeCards(paymentCardsInput)
    const favoriteMoviesInput = body.favoriteMovies !== undefined ? body.favoriteMovies : body.favorites
    const favoriteMovies = normalizeFavoriteMovies(favoriteMoviesInput)

    if (!name) {
      return Response.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    if (incomingAddress.length > 1) {
      return Response.json(
        { success: false, error: 'Only one address is allowed' },
        { status: 400 },
      )
    }

    if (paymentCards.length > 3) {
      return Response.json(
        { success: false, error: 'Only up to 3 payment cards are allowed' },
        { status: 400 },
      )
    }

    if (paymentCards.some(hasIncompleteCard)) {
      return Response.json(
        { success: false, error: 'Each payment card must include card number, expiration date, and CVV' },
        { status: 400 },
      )
    }

    existingUser.name = name
    existingUser.address = incomingAddress
    existingUser.payments = paymentCards
    existingUser.no_payments = String(paymentCards.length)
    existingUser.favorites = favoriteMovies

    const updatedUser = await existingUser.save()
    const safeUser = updatedUser.toObject()
    delete safeUser.password
    safeUser.paymentCards = safeUser.payments || []
    safeUser.favoriteMovies = safeUser.favorites || []

    return Response.json({ success: true, user: safeUser }, { status: 200 })
  } catch (error) {
    console.error('Error updating user profile:', error)
    if (error?.name === 'CastError') {
      return Response.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 },
      )
    }
    return Response.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 },
    )
  }
}
