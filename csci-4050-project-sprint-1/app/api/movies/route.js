import dbConnect from '../../../database/db';
import Movie from '../../../models/movie';
import { getSessionUser } from '../../../lib/auth/current-user';

const ALLOWED_USER_RATINGS = ['1/5', '2/5', '3/5', '4/5', '5/5'];
const ALLOWED_AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
const ALLOWED_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

export function buildMoviePayload(body) {
  return {
    title: String(body.title || '').trim(),
    rating: String(body.rating || '').trim(),
    age_rating: String(body.age_rating || '').trim(),
    genre: String(body.genre || '').trim(),
    secondaryGenre: String(body.secondaryGenre || '').trim(),
    status: String(body.status || '').trim(),
    description: String(body.description || '').trim(),
    poster_url: String(body.poster_url || '').trim(),
    trailer_url: String(body.trailer_url || '').trim(),
    showtimes: Array.isArray(body.showtimes) ? body.showtimes : [],
  };
}

export function validateMoviePayload(payload) {
  const requiredFields = ['title', 'rating', 'age_rating', 'genre', 'status', 'description'];
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }

  const allowedStatuses = ['Currently Running', 'Coming Soon'];
  if (!allowedStatuses.includes(payload.status)) {
    return 'Status must be either "Currently Running" or "Coming Soon".';
  }

  if (!ALLOWED_USER_RATINGS.includes(payload.rating)) {
    return 'User rating must be one of the provided dropdown options.';
  }

  if (!ALLOWED_AGE_RATINGS.includes(payload.age_rating)) {
    return 'Age rating must be one of the provided dropdown options.';
  }

  if (!ALLOWED_GENRES.includes(payload.genre)) {
    return 'Genre must be one of the provided dropdown options.';
  }

  if (payload.secondaryGenre && !ALLOWED_GENRES.includes(payload.secondaryGenre)) {
    return 'Secondary genre must be one of the provided dropdown options.';
  }

  if (payload.secondaryGenre && payload.secondaryGenre === payload.genre) {
    return 'Please select two different genres.';
  }

  if (payload.poster_url && !isValidUrl(payload.poster_url)) {
    return 'Poster URL must be a valid http or https URL.';
  }

  if (payload.trailer_url && !isValidUrl(payload.trailer_url)) {
    return 'Trailer URL must be a valid http or https URL.';
  }

  return '';
}

export async function GET(request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Database connected successfully');

    // Fetch all movies from the collection
    const movies = await Movie.find({}).sort({ createdAt: -1, title: 1 });
    console.log(`Found ${movies.length} movies in database`);
    //console.log('Movies:', movies);

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

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to add movies.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const payload = buildMoviePayload(body);
    const validationError = validateMoviePayload(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const createdMovie = await Movie.create(payload);

    return Response.json(createdMovie, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating movie:', error);
    return Response.json(
      { error: error.message || 'Failed to create movie', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
