import dbConnect from '../../../database/db'
import Movie from '../../../models/movie'

// Seed data for testing
const seedMovies = [
  {
    title: 'The Great Adventure',
    poster_url: 'https://via.placeholder.com/300x450?text=The+Great+Adventure',
    rating: '8.5',
    genre: 'Action, Adventure',
    status: 'Now Showing',
    showtimes: ['14:00', '17:00', '20:00', '22:30'],
    showroom: 'Room A',
    description: 'An epic adventure story with stunning visuals and thrilling action sequences.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Romance Under Starlight',
    poster_url: 'https://via.placeholder.com/300x450?text=Romance+Under+Starlight',
    rating: '8.0',
    genre: 'Romance, Drama',
    status: 'Now Showing',
    showtimes: ['15:00', '18:00', '21:00'],
    showroom: 'Room B',
    description: 'A touching love story set in a beautiful coastal town.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Sci-Fi Chronicles',
    poster_url: 'https://via.placeholder.com/300x450?text=Sci-Fi+Chronicles',
    rating: '9.0',
    genre: 'Science Fiction, Thriller',
    status: 'Now Showing',
    showtimes: ['13:00', '16:00', '19:00', '22:00'],
    showroom: 'Room C',
    description: 'A futuristic thriller that challenges the limits of imagination.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Comedy Nights Out',
    poster_url: 'https://via.placeholder.com/300x450?text=Comedy+Nights+Out',
    rating: '7.5',
    genre: 'Comedy',
    status: 'Now Showing',
    showtimes: ['15:30', '18:30', '21:30'],
    showroom: 'Room A',
    description: 'A hilarious comedy that will keep you laughing throughout.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Mystery Manor',
    poster_url: 'https://via.placeholder.com/300x450?text=Mystery+Manor',
    rating: '8.3',
    genre: 'Mystery, Thriller',
    status: 'Now Showing',
    showtimes: ['14:30', '17:30', '20:30'],
    showroom: 'Room B',
    description: 'A gripping mystery film with unexpected twists and turns.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Animation Dreams',
    poster_url: 'https://via.placeholder.com/300x450?text=Animation+Dreams',
    rating: '8.7',
    genre: 'Animation, Family',
    status: 'Now Showing',
    showtimes: ['11:00', '13:30', '16:00', '18:30'],
    showroom: 'Room C',
    description: 'A colorful and magical animated adventure for the whole family.',
    trailer_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
]

export async function GET(request) {
  try {
    // Check if seed parameter is provided
    const { searchParams } = new URL(request.url)
    const shouldSeed = searchParams.get('seed') === 'true'

    if (!shouldSeed) {
      return Response.json(
        {
          message: 'Seed endpoint. Use ?seed=true to populate test data',
          movies_count: await Movie.countDocuments(),
        },
        { status: 200 }
      )
    }

    await dbConnect()

    // Clear existing movies (optional - comment out to append)
    // await Movie.deleteMany({})

    // Check for existing movies to avoid duplicates
    const existingCount = await Movie.countDocuments({
      title: { $in: seedMovies.map((m) => m.title) },
    })

    if (existingCount > 0) {
      return Response.json(
        {
          message: 'Some movies already exist. Skipping duplicate insertion.',
          existing_count: existingCount,
          total_movies: await Movie.countDocuments(),
        },
        { status: 200 }
      )
    }

    // Insert seed movies
    const insertedMovies = await Movie.insertMany(seedMovies)

    return Response.json(
      {
        success: true,
        message: 'Database seeded successfully',
        inserted_count: insertedMovies.length,
        total_movies: await Movie.countDocuments(),
        movies: insertedMovies.map((m) => ({
          _id: m._id,
          title: m.title,
          showtimes: m.showtimes,
          showroom: m.showroom,
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error seeding database:', error)
    return Response.json(
      {
        error: 'Failed to seed database',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
