import dbConnect from '../../../../database/db';
import Movie from '../../../../models/movie';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();

    // Fetch all movies from the collection
    const movies = await Movie.find({});

    // Return the movies as JSON
    return new Response(JSON.stringify(movies), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch movies' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
