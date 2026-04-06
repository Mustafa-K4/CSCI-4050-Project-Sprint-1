import dbConnect from '../../../database/db';
import Ticket from '../../../models/ticket';

export async function GET(request) {
  try {
    const conn = await dbConnect();
    console.log('Database connected successfully');

    const tickets = await Ticket.find({}).populate('booking');
    console.log(`Found ${tickets.length} tickets in database`);

    return Response.json(tickets, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch tickets', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    const conn = await dbConnect();
    console.log('Database connected successfully');

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['basePrice', 'booking', 'price', 'seat', 'ticketType'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const ticket = new Ticket({
      basePrice: body.basePrice,
      booking: body.booking,
      price: body.price,
      seat: body.seat,
      ticketType: body.ticketType,
    });

    const savedTicket = await ticket.save();
    await savedTicket.populate('booking');
    console.log('Ticket created successfully:', savedTicket._id);

    return Response.json(savedTicket, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return Response.json(
      { error: error.message || 'Failed to create ticket', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
