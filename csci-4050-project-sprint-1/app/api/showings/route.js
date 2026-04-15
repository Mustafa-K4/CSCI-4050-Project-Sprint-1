import mongoose from 'mongoose';
import dbConnect from '../../../database/db';
import Movie from '../../../models/movie';
import Showing from '../../../models/showing';
import Showroom from '../../../models/showroom';
import { getSessionUser } from '../../../lib/auth/current-user';
import { ensureDefaultShowrooms } from '../../../lib/admin/showrooms';

export async function GET(request) {
  try {
    await dbConnect();
    console.log('Database connected successfully');

    const showings = await Showing.find({})
      .sort({ date: 1, time: 1 })
      .populate('showroomID')
      .populate('showingMovie');
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
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to schedule showtimes.' },
        { status: 403 }
      );
    }

    await dbConnect();
    await ensureDefaultShowrooms();
    console.log('Database connected successfully');

    const body = await request.json();

    const payload = {
      date: String(body.date || '').trim(),
      showroomID: String(body.showroomID || '').trim(),
      showingMovie: String(body.showingMovie || '').trim(),
      time: String(body.time || '').trim(),
      duration: Number(body.duration || 120),
    };

    const requiredFields = ['date', 'showroomID', 'showingMovie', 'time'];
    const missingFields = requiredFields.filter(field => !payload[field]);

    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      return Response.json(
        { error: 'Date must be provided in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(payload.time)) {
      return Response.json(
        { error: 'Time must be provided in 24-hour HH:MM format.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
      return Response.json(
        { error: 'Duration must be a positive number of minutes.' },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(payload.showroomID) ||
      !mongoose.Types.ObjectId.isValid(payload.showingMovie)
    ) {
      return Response.json(
        { error: 'Selected movie or showroom is invalid.' },
        { status: 400 }
      );
    }

    const showingDate = new Date(`${payload.date}T00:00:00`);
    if (Number.isNaN(showingDate.getTime())) {
      return Response.json(
        { error: 'A valid show date is required.' },
        { status: 400 }
      );
    }

    const [movie, showroom] = await Promise.all([
      Movie.findById(payload.showingMovie),
      Showroom.findById(payload.showroomID),
    ]);

    if (!movie) {
      return Response.json(
        { error: 'The selected movie was not found.' },
        { status: 404 }
      );
    }

    if (!showroom) {
      return Response.json(
        { error: 'The selected showroom was not found.' },
        { status: 404 }
      );
    }

    const dayStart = new Date(showingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const conflictingShowing = await Showing.findOne({
      showroomID: payload.showroomID,
      time: payload.time,
      date: {
        $gte: dayStart,
        $lt: dayEnd,
      },
    })
      .populate('showroomID')
      .populate('showingMovie');

    if (conflictingShowing) {
      return Response.json(
        {
          error: `Scheduling conflict. ${showroom.cinema} already has a showtime at ${payload.time} on ${payload.date}.`,
        },
        { status: 409 }
      );
    }

    const showing = new Showing({
      date: showingDate,
      duration: payload.duration,
      showroomID: payload.showroomID,
      showingMovie: payload.showingMovie,
      time: payload.time,
    });

    const savedShowing = await showing.save();
    await savedShowing.populate(['showroomID', 'showingMovie']);
    console.log('Showing created successfully:', savedShowing._id);

    await Movie.findByIdAndUpdate(payload.showingMovie, {
      $addToSet: { showtimes: payload.time },
      $set: { showroom: showroom.cinema },
    });

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
