import { NextResponse } from 'next/server';
import dbConnect from '../../../../database/db';
import Movie from '../../../../models/movie';

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
