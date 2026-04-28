import dbConnect from '../../../../database/db';
import Movie from '../../../../models/movie';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title || !title.trim()) {
      return Response.json(
        { error: 'Search title is required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await dbConnect();

    const movies = await Movie.find({
      title: { $regex: title.trim(), $options: 'i' }
    });

    return Response.json(movies, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    return Response.json(
      { error: error.message || 'Failed to search movies', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
