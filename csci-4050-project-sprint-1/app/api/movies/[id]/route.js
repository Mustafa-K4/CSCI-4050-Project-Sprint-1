import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../../database/db';
import Movie from '../../../../models/movie';
import { getSessionUser } from '../../../../lib/auth/current-user';
import { buildMoviePayload, validateMoviePayload } from '../route';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(movie, { status: 200 });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges are required to edit movies.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'A valid movie ID is required.' },
        { status: 400 }
      );
    }

    const existingMovie = await Movie.findById(id);
    if (!existingMovie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const payload = buildMoviePayload({
      ...body,
      showtimes: existingMovie.showtimes,
    });

    const validationError = validateMoviePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    existingMovie.title = payload.title;
    existingMovie.rating = payload.rating;
    existingMovie.age_rating = payload.age_rating;
    existingMovie.genre = payload.genre;
    existingMovie.secondaryGenre = payload.secondaryGenre;
    existingMovie.status = payload.status;
    existingMovie.description = payload.description;
    existingMovie.poster_url = payload.poster_url;
    existingMovie.trailer_url = payload.trailer_url;

    await existingMovie.save();

    return NextResponse.json(existingMovie, { status: 200 });
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update movie' },
      { status: 500 }
    );
  }
}
