import mongoose from 'mongoose'
import dbConnect from '../../../../database/db'
import Ticket from '../../../../models/ticket'

export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      )
    }

    const ticket = await Ticket.findById(id).populate('booking')

    if (!ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return Response.json(ticket, { status: 200 })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const { id } = await params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      )
    }

    const ticket = await Ticket.findById(id)

    if (!ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    if (body.seat !== undefined) ticket.seat = String(body.seat)
    if (body.ticketType !== undefined) ticket.ticketType = String(body.ticketType)
    if (body.price !== undefined) ticket.price = Number(body.price)
    if (body.basePrice !== undefined) ticket.basePrice = Number(body.basePrice)

    await ticket.save()

    return Response.json(ticket, { status: 200 })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return Response.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      )
    }

    const ticket = await Ticket.findByIdAndDelete(id)

    if (!ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }
    return Response.json(
      { success: true, message: 'Ticket deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return Response.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
