import dbConnect from '../../../database/db';
import Showroom from '../../../models/showroom';

export async function GET(request) {
  try {
    const conn = await dbConnect();
    console.log('Database connected successfully');

    const showrooms = await Showroom.find({});
    console.log(`Found ${showrooms.length} showrooms in database`);

    return Response.json(showrooms, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching showrooms:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch showrooms', details: error.toString() },
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
    const requiredFields = ['cinema', 'seatcount'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const showroom = new Showroom({
      cinema: body.cinema,
      seatcount: body.seatcount,
    });

    const savedShowroom = await showroom.save();
    console.log('Showroom created successfully:', savedShowroom._id);

    return Response.json(savedShowroom, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating showroom:', error);
    return Response.json(
      { error: error.message || 'Failed to create showroom', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
