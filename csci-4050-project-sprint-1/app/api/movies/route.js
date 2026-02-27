import dbConnect from '../../../database/db';
import Movie from '../../../models/movie';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');

    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (genre && genre !== 'All') {
      query.genre = genre;
    }

    const movies = await Movie.find(query);
    return Response.json(movies, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch movies' }, { status: 500 });
  }
}

