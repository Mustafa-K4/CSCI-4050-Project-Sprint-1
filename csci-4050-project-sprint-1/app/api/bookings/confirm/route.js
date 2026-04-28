import dbConnect from '../../../../database/db'
import Booking from '../../../../models/booking'
import Ticket from '../../../../models/ticket'
import { sendBookingConfirmationEmail } from '../../../../lib/auth/email'

const TICKET_PRICES = { adult: 12, child: 8, senior: 10 }

function formatSeatLabel(seat) {
  const match = String(seat || '').match(/^(\d+)-(\d+)$/)
  if (!match) return String(seat || '')

  const rowIndex = Number(match[1])
  const colIndex = Number(match[2])
  return `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { bookingId, userId, paymentMethod } = body

    if (!bookingId) {
      return Response.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(bookingId).populate('movieId')
    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status === 'confirmed') {
      return Response.json(
        {
          success: true,
          booking: {
            _id: booking._id,
            confirmationCode: booking.confirmationCode,
            status: booking.status,
            movieTitle: booking.movieId?.title,
            showtime: booking.showtime,
            seats: booking.seats,
            totalPrice: booking.totalAmount,
          },
        },
        { status: 200 }
      )
    }

    const conflictingTickets = await Ticket.find({
      showing: booking.showingId,
      seat: { $in: booking.seats || [] },
      booking: { $ne: booking._id },
    }).populate('booking')

    const conflictingSeats = conflictingTickets
      .filter((ticket) => ticket.booking?.status === 'confirmed')
      .map((ticket) => ticket.seat)

    if (conflictingSeats.length > 0) {
      return Response.json(
        {
          error: 'One or more selected seats are no longer available.',
          conflictingSeats,
        },
        { status: 409 }
      )
    }

    const seatSelections =
      booking.seatSelections instanceof Map
        ? Object.fromEntries(booking.seatSelections)
        : booking.seatSelections || {}

    const ticketEntries = (booking.seats || []).map((seat) => {
      const ticketType = seatSelections[seat] || 'adult'
      const price = TICKET_PRICES[ticketType] || TICKET_PRICES.adult

      return {
        booking: booking._id,
        showing: booking.showingId,
        seat,
        ticketType,
        basePrice: price,
        price,
      }
    })

    const createdTickets = ticketEntries.length > 0 ? await Ticket.insertMany(ticketEntries) : []

    booking.status = 'confirmed'
    if (userId) {
      booking.userID = userId
    }
    booking.tickets = createdTickets.map((ticket) => ticket._id)

    if (!booking.paymentInfo) {
      booking.paymentInfo = { method: '', status: 'pending' }
    }
    if (paymentMethod) {
      booking.paymentInfo.method = paymentMethod
    }
    booking.paymentInfo.status = 'completed'

    await booking.save()

    try {
      if (booking.customerInfo?.email) {
        await sendBookingConfirmationEmail({
          to: booking.customerInfo.email,
          bookingDetails: {
          movieTitle: booking.movieId?.title || 'Movie',
          showtime: booking.showtime,
          seats: (booking.seats || []).map((seat) => formatSeatLabel(seat)),
          confirmationCode: booking.confirmationCode,
          totalPrice: booking.totalAmount,
          customerName: booking.customerInfo.name,
          },
        })
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return Response.json(
      {
        success: true,
        booking: {
          _id: booking._id,
          confirmationCode: booking.confirmationCode,
          status: booking.status,
          movieTitle: booking.movieId?.title,
          showtime: booking.showtime,
          seats: booking.seats,
          totalPrice: booking.totalAmount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error confirming booking:', error)
    return Response.json(
      { error: error.message || 'Failed to confirm booking' },
      { status: 500 }
    )
  }
}
