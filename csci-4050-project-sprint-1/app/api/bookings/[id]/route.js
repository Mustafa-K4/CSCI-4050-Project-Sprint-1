import mongoose from 'mongoose'
import dbConnect from '../../../../database/db'
import Booking from '../../../../models/booking'
import Ticket from '../../../../models/ticket'
import { getSessionUser } from '../../../../lib/auth/current-user'

export async function PUT(request, { params }) {
  try {
    const { id: bookingId } = await params
    const body = await request.json()

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(bookingId)
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

    const { ticketId, action } = body

    if (action === 'add' && ticketId) {
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return Response.json(
          { error: 'Invalid ticket ID format' },
          { status: 400 }
        )
      }

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

      booking.tickets = booking.tickets.filter(id => !id.equals(ticketId))
      await Ticket.findByIdAndDelete(ticketId)
    } else if (body.tickets !== undefined) {
      const existingTickets = booking.tickets || []
      if (Array.isArray(body.tickets) && body.tickets.length === 0 && existingTickets.length > 0) {
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
