import dbConnect from '../../../database/db'
import Booking from '../../../models/booking'
import Movie from '../../../models/movie'
import Promotion from '../../../models/promotion'
import Showing from '../../../models/showing'
import { getSessionUser } from '../../../lib/auth/current-user'
import { TICKET_PRICES } from '../../../lib/booking/ticketFactory'

function generateConfirmationCode() {
  return `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

const TICKET_TYPES = ['adult', 'child', 'senior']

// Validation helper functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(String(email || '').trim())
}

function validateBookingData(body) {
  const errors = []
  const seats = Array.isArray(body.seats) ? body.seats.map((seat) => String(seat)) : []
  const uniqueSeats = new Set(seats)

  if (!body.movieId) {
    errors.push('Movie ID is required')
  }

  if (!body.userId) {
    errors.push('User ID is required')
  }

  if (!body.showingId) {
    errors.push('Showing ID is required')
  }

  if (!body.showtime || typeof body.showtime !== 'string') {
    errors.push('Showtime is required and must be valid')
  }

  if (seats.length === 0) {
    errors.push('At least one seat must be selected')
  } else if (uniqueSeats.size !== seats.length) {
    errors.push('Duplicate seats are not allowed')
  }

  if (!body.seatSelections || typeof body.seatSelections !== 'object' || Array.isArray(body.seatSelections)) {
    errors.push('Seat selections are required')
  }

  if (!body.customerInfo) {
    errors.push('Customer information is required')
  } else {
    const { name, email } = body.customerInfo
    if (!name || name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters')
    }
    if (!validateEmail(email)) {
      errors.push('Valid email address is required')
    }
  }

  if (!body.ticketTypes) {
    errors.push('Ticket types are required')
  } else {
    const counts = TICKET_TYPES.map((type) => Number(body.ticketTypes[type] || 0))
    const hasInvalidCount = counts.some((count) => !Number.isInteger(count) || count < 0)
    const total = counts.reduce((sum, count) => sum + count, 0)

    if (hasInvalidCount) {
      errors.push('Ticket counts must be non-negative whole numbers')
    }

    if (total !== seats.length) {
      errors.push('Total tickets must match number of seats')
    }

    if (total === 0) {
      errors.push('At least one ticket must be selected')
    }
  }

  if (body.seatSelections && typeof body.seatSelections === 'object') {
    const selectionEntries = Object.entries(body.seatSelections)
    const selectedSeatCount = selectionEntries.length
    const seatSet = new Set(seats)
    const invalidSeatSelection = selectionEntries.some(
      ([seat, type]) => !seatSet.has(String(seat)) || !TICKET_TYPES.includes(String(type))
    )

    if (selectedSeatCount !== seats.length) {
      errors.push('Seat selections must match the selected seats')
    }

    if (invalidSeatSelection) {
      errors.push('Seat selections must use selected seats and valid ticket types')
    }

    if (body.ticketTypes && !invalidSeatSelection) {
      const selectionCounts = TICKET_TYPES.reduce((counts, type) => ({
        ...counts,
        [type]: selectionEntries.filter(([, selectedType]) => String(selectedType) === type).length,
      }), {})
      const mismatchedType = TICKET_TYPES.find(
        (type) => selectionCounts[type] !== Number(body.ticketTypes[type] || 0)
      )

      if (mismatchedType) {
        errors.push('Ticket age groups must match the selected seat assignments')
      }
    }
  }

  if (body.promotionCode && !/^[A-Z0-9_-]{3,24}$/i.test(String(body.promotionCode).trim())) {
    errors.push('Promotion code must be 3-24 characters using letters, numbers, dashes, or underscores')
  }

  return errors
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()

    const validationErrors = validateBookingData(body)
    if (validationErrors.length > 0) {
      return Response.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    const {
      movieId,
      userId,
      showingId,
      showtime,
      seats,
      seatSelections,
      ticketTypes,
      customerInfo,
      paymentMethod,
      promotionCode,
    } = body

    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return Response.json(
        { error: 'You must be logged in to complete checkout.' },
        { status: 401 }
      )
    }

    const isOwner = sessionUser._id?.toString() === userId
    if (!isOwner && sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden.' },
        { status: 403 }
      )
    }

    const [movie, showing] = await Promise.all([
      Movie.findById(movieId),
      Showing.findById(showingId),
    ])

    if (!movie) {
      return Response.json(
        { error: 'Movie not found' },
        { status: 404 }
      )
    }

    if (!showing) {
      return Response.json(
        { error: 'Showing not found' },
        { status: 404 }
      )
    }

    const normalizedTicketTypes = {
      adult: Number(ticketTypes?.adult || 0),
      child: Number(ticketTypes?.child || 0),
      senior: Number(ticketTypes?.senior || 0),
    }

    const subtotalPrice =
      (normalizedTicketTypes.adult * TICKET_PRICES.adult) +
      (normalizedTicketTypes.child * TICKET_PRICES.child) +
      (normalizedTicketTypes.senior * TICKET_PRICES.senior)

    let appliedPromotionCode = ''
    let discountAmount = 0
    const normalizedPromotionCode = String(promotionCode || '').trim().toUpperCase()

    if (normalizedPromotionCode) {
      const promotion = await Promotion.findOne({ promoCode: normalizedPromotionCode })
      if (!promotion) {
        return Response.json(
          { error: 'Promotion code was not found.' },
          { status: 400 }
        )
      }

      const expirationDate = new Date(promotion.expirationDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (Number.isNaN(expirationDate.getTime()) || expirationDate < today) {
        return Response.json(
          { error: 'Promotion code has expired.' },
          { status: 400 }
        )
      }

      appliedPromotionCode = promotion.promoCode
      discountAmount = Math.min(Number(promotion.discountAmount || 0), subtotalPrice)
    }

    const totalPrice = Math.max(subtotalPrice - discountAmount, 0)

    const confirmationCode = generateConfirmationCode()
    const booking = await Booking.create({
      userID: userId,
      movieId,
      showingId,
      bookingDate: new Date(),
      bookingFee: subtotalPrice,
      subtotalAmount: subtotalPrice,
      discountAmount,
      promotionCode: appliedPromotionCode,
      paymentReference: `TEMP-${confirmationCode}`,
      status: 'pending',
      taxAmount: 0,
      totalAmount: totalPrice,
      showtime,
      seats: seats.map((seat) => String(seat)),
      seatSelections: Object.fromEntries(
        Object.entries(seatSelections || {}).map(([seat, type]) => [String(seat), String(type)])
      ),
      ticketTypes: normalizedTicketTypes,
      customerInfo: {
        name: String(customerInfo.name || '').trim(),
        email: String(customerInfo.email || '').trim(),
        address: String(customerInfo.address || '').trim(),
      },
      confirmationCode,
      paymentInfo: {
        method: paymentMethod || 'card',
        status: 'pending',
      },
      tickets: [],
    })

    return Response.json(
      {
        success: true,
        booking: {
          _id: booking._id,
          confirmationCode: booking.confirmationCode,
          movieId: booking.movieId,
          showingId: booking.showingId,
          showtime: booking.showtime,
          seats: booking.seats,
          subtotalPrice: booking.subtotalAmount,
          discountAmount: booking.discountAmount,
          promotionCode: booking.promotionCode,
          totalPrice: booking.totalAmount,
          customerEmail: booking.customerInfo?.email,
          status: booking.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return Response.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    if (bookingId) {
      const booking = await Booking.findById(bookingId).populate('movieId')
      if (!booking) {
        return Response.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      const sessionUser = await getSessionUser()
      const isOwner = sessionUser?._id?.toString() === booking.userID?.toString()
      if (!sessionUser || (!isOwner && sessionUser.role !== 'admin')) {
        return Response.json(
          { error: 'Forbidden.' },
          { status: 403 }
        )
      }

      return Response.json({ booking }, { status: 200 })
    }

    if (userId) {
      const sessionUser = await getSessionUser()
      if (!sessionUser) {
        return Response.json(
          { error: 'You must be logged in to view order history.' },
          { status: 401 }
        )
      }

      const isOwner = sessionUser._id?.toString() === userId
      if (!isOwner && sessionUser.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden.' },
          { status: 403 }
        )
      }

      const query = { userID: userId }

      if (status) {
        query.status = status
      }

      const booking = await Booking.find(query)
        .populate('movieId')
        .populate('showingId')
        .sort({ createdAt: -1, bookingDate: -1 })
      return Response.json({ bookings: booking }, { status: 200 })
    }

    return Response.json(
      { error: 'Please provide booking ID or user ID' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
