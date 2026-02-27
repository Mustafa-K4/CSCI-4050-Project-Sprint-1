import dbConnect from '../../../../database/db';
import Movie from '../../../../models/movie';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const movie = await Movie.findById(params.id);

    if (!movie) {
      return Response.json({ error: 'Movie not found' }, { status: 404 });
    }

    return Response.json(movie, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch movie' }, { status: 500 });
  }
}