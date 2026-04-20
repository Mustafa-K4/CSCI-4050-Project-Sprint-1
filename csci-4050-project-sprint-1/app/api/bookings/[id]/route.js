import mongoose from 'mongoose'
import dbConnect from '../../../../database/db'
import Booking from '../../../../models/booking'
import Ticket from '../../../../models/ticket'

export async function PUT(request, { params }) {
  try {
    const { id: bookingId } = await params
    const body = await request.json()

    await dbConnect()

    // Validate bookingId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

    // Find existing booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Handle ticket updates
    const { ticketId, action } = body // action: "add" or "remove"

    if (action === 'add' && ticketId) {
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return Response.json(
          { error: 'Invalid ticket ID format' },
          { status: 400 }
        )
      }

      // Add ticket ID if not already in list
      if (!booking.tickets.includes(ticketId)) {
        booking.tickets.push(ticketId)
      }
    } else if (action === 'remove' && ticketId) {
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return Response.json(
          { error: 'Invalid ticket ID format' },
          { status: 400 }
        )
      }

      // Remove ticket ID from list
      booking.tickets = booking.tickets.filter(id => !id.equals(ticketId))

      // Delete the ticket document
      await Ticket.findByIdAndDelete(ticketId)
    } else if (body.tickets !== undefined) {
      // Full replacement mode (for clearing)
      const existingTickets = booking.tickets || []
      if (Array.isArray(body.tickets) && body.tickets.length === 0 && existingTickets.length > 0) {
        // Delete all existing tickets
        await Ticket.deleteMany({ _id: { $in: existingTickets } })
      }
      booking.tickets = body.tickets || []
    }

    await booking.save()

    return Response.json(
      {
        success: true,
        booking,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating booking:', error)
    return Response.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    )
  }
}
