import dbConnect from '../../../database/db';
import Movie from '../../../models/movie';

export async function GET(request) {
  try {
    // Connect to MongoDB
    const conn = await dbConnect();
    console.log('Database connected successfully');

    // Fetch all movies from the collection
    const movies = await Movie.find({});
    console.log(`Found ${movies.length} movies in database`);
    console.log('Movies:', movies);

    // Return the movies as JSON
    return Response.json(movies, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch movies', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

