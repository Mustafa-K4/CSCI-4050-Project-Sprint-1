import dbConnect from '../../../database/db'
import Booking from '../../../models/booking'
import Movie from '../../../models/movie'
//import { v4 as uuidv4 } from 'uuid'

function generateConfirmationCode() {
  return `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Validation helper functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function validateBookingData(body) {
  const errors = []

  // Validate movieId
  if (!body.movieId) {
    errors.push('Movie ID is required')
  }

  // Validate showtime
  if (!body.showtime || typeof body.showtime !== 'string') {
    errors.push('Showtime is required and must be valid')
  }

  // Validate seats
  if (!Array.isArray(body.seats) || body.seats.length === 0) {
    errors.push('At least one seat must be selected')
  }

  // Validate customer info
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

  // Validate ticket types if provided
  if (body.ticketTypes) {
    const { adult, child, senior } = body.ticketTypes
    const total = (adult || 0) + (child || 0) + (senior || 0)
    if (total !== body.seats.length) {
      errors.push('Total tickets must match number of seats')
    }
  }

  return errors
}

export async function POST(request) {
  try {
    const conn = await dbConnect()
    const body = await request.json()

    // Validate all required fields
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
      showtime,
      seats,
      numberOfTickets,
      ticketTypes,
      customerInfo,
    } = body

    // Verify movie exists
    const movie = await Movie.findById(movieId)
    if (!movie) {
      return Response.json(
        { error: 'Movie not found' },
        { status: 404 }
      )
    }

    // Calculate total price (for now, using adult ticket price: $12)
    const TICKET_PRICES = { adult: 12, child: 8, senior: 10 }
    const ticketCount = ticketTypes?.adult || seats.length
    const totalPrice = ticketCount * TICKET_PRICES.adult

    // Create booking
    const confirmationCode = generateConfirmationCode()
    const booking = new Booking({
      movieId,
      userId: userId || null,
      showtime,
      seats,
      numberOfTickets: seats.length,
      ticketTypes: ticketTypes || { adult: seats.length, child: 0, senior: 0 },
      totalPrice,
      customerInfo: {
        name: customerInfo.name.trim(),
        email: customerInfo.email.toLowerCase().trim(),
        address: (customerInfo.address || '').trim(),
      },
      status: 'pending',
      confirmationCode,
      paymentInfo: {
        method: 'card',
        status: 'pending',
      },
    })

    await booking.save()

    return Response.json(
      {
        success: true,
        booking: {
          _id: booking._id,
          confirmationCode: booking.confirmationCode,
          movieId: booking.movieId,
          showtime: booking.showtime,
          seats: booking.seats,
          totalPrice: booking.totalPrice,
          customerEmail: booking.customerInfo.email,
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (bookingId) {
      const booking = await Booking.findById(bookingId).populate('movieId')
      if (!booking) {
        return Response.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      return Response.json({ booking }, { status: 200 })
    }

    if (userId) {
      const booking = await Booking.find({ userId }).populate('movieId')
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
