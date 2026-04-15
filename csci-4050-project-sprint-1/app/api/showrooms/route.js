import dbConnect from '../../../database/db';
import Showroom from '../../../models/showroom';
import { getSessionUser } from '../../../lib/auth/current-user';
import { ensureDefaultShowrooms } from '../../../lib/admin/showrooms';

export async function GET(request) {
  try {
    await dbConnect();
    console.log('Database connected successfully');

    const showrooms = await ensureDefaultShowrooms();
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
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to manage showrooms.' },
        { status: 403 }
      );
    }

    await dbConnect();
    console.log('Database connected successfully');

    const body = await request.json();

    const payload = {
      cinema: String(body.cinema || '').trim(),
      seatcount: Number(body.seatcount),
    };

    const requiredFields = ['cinema', 'seatcount'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Number.isFinite(payload.seatcount) || payload.seatcount <= 0) {
      return Response.json(
        { error: 'Seat count must be a positive number.' },
        { status: 400 }
      );
    }

    const existingShowroom = await Showroom.findOne({
      cinema: { $regex: `^${payload.cinema.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existingShowroom) {
      return Response.json(
        { error: 'A showroom with that name already exists.' },
        { status: 409 }
      );
    }

    const showroom = new Showroom({
      cinema: payload.cinema,
      seatcount: payload.seatcount,
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
