import mongoose from 'mongoose'
import dbConnect from '../../../database/db'
import Booking from '../../../models/booking'
import Ticket from '../../../models/ticket'


void Booking

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const showingId = searchParams.get('showing')
    const query = {}

    if (showingId) {
      if (!mongoose.Types.ObjectId.isValid(showingId)) {
        return Response.json(
          { error: 'Invalid showing ID format' },
          { status: 400 }
        )
      }

      query.showing = showingId
    }

    const tickets = await Ticket.find(query).populate('booking')
    const visibleTickets = tickets.filter((ticket) => ticket.booking?.status === 'confirmed')

    return Response.json(visibleTickets, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch tickets', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Single ticket creation only
    const requiredFields = ['booking', 'seat', 'ticketType', 'price', 'showing']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(body.booking)) {
      return Response.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

    const ticket = await Ticket.create({
      booking: body.booking,
      seat: String(body.seat),
      ticketType: String(body.ticketType),
      basePrice: Number(body.price),
      price: Number(body.price),
      showing: body.showing,

    })

    return Response.json(ticket, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return Response.json(
      { error: error.message || 'Failed to create ticket', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
