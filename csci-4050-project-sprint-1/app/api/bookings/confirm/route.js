import dbConnect from '../../../../database/db'
import Booking from '../../../../models/booking'
import Movie from '../../../../models/movie'
import { sendBookingConfirmationEmail } from '../../../../lib/auth/email'

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

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('movieId')
    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking status
    booking.status = 'confirmed'
    if (userId) {
      booking.userId = userId
    }
    if (paymentMethod) {
      booking.paymentInfo.method = paymentMethod
      booking.paymentInfo.status = 'completed'
    }

    await booking.save()

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(
        booking.customerInfo.email,
        {
          movieTitle: booking.movieId?.title || 'Movie',
          showtime: booking.showtime,
          seats: booking.seats,
          confirmationCode: booking.confirmationCode,
          totalPrice: booking.totalPrice,
          customerName: booking.customerInfo.name,
        }
      )
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Don't fail the booking confirmation if email fails
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
          totalPrice: booking.totalPrice,
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
