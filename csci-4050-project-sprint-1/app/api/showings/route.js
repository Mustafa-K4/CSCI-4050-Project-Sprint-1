import dbConnect from '../../../database/db';
import Showing from '../../../models/showing';

export async function GET(request) {
  try {
    const conn = await dbConnect();
    console.log('Database connected successfully');

    const showings = await Showing.find({}).populate('showroomID').populate('showingMovie');
    console.log(`Found ${showings.length} showings in database`);

    return Response.json(showings, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching showings:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch showings', details: error.toString() },
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
    const requiredFields = ['date', 'duration', 'showroomID', 'showingMovie', 'time'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const showing = new Showing({
      date: body.date,
      duration: body.duration,
      showroomID: body.showroomID,
      showingMovie: body.showingMovie,
      time: body.time,
    });

    const savedShowing = await showing.save();
    await savedShowing.populate(['showroomID', 'showingMovie']);
    console.log('Showing created successfully:', savedShowing._id);

    return Response.json(savedShowing, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating showing:', error);
    return Response.json(
      { error: error.message || 'Failed to create showing', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
