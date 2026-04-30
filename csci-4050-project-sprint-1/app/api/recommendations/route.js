import dbConnect from '../../../database/db'
import Booking from '../../../models/booking'
import Movie from '../../../models/movie'
import User from '../../../models/user'
import { getSessionUser } from '../../../lib/auth/current-user'
import { getGeminiRecommendations } from '../../../lib/recommendations/geminiRecommendationAdapter'

const MAX_RECOMMENDATIONS = 4

function getMovieId(value) {
  if (!value) return ''
  return String(value._id || value.id || value.movieId || value || '')
}

function normalizeGenre(value) {
  return String(value || '').trim()
}

function getMovieGenres(movie) {
  return [normalizeGenre(movie.genre), normalizeGenre(movie.secondaryGenre)].filter(Boolean)
}

function normalizeMovie(movie) {
  return {
    _id: getMovieId(movie),
    title: movie.title || 'Untitled Movie',
    genre: movie.genre || '',
    secondaryGenre: movie.secondaryGenre || '',
    status: movie.status || '',
    rating: movie.rating || '',
    age_rating: movie.age_rating || '',
    poster_url: movie.poster_url || '',
    description: movie.description || '',
  }
}

function parseRatingScore(rating) {
  const match = String(rating || '').match(/^(\d+(?:\.\d+)?)\s*\/\s*5$/)
  return match ? Number(match[1]) : 0
}

function buildReason(movie, preferredGenres) {
  const genres = getMovieGenres(movie)
  const matchingGenre = genres.find((genre) => preferredGenres.has(genre))

  if (matchingGenre) {
    return `Recommended because you have shown interest in ${matchingGenre} movies.`
  }

  if (String(movie.status || '').toLowerCase().includes('run')) {
    return 'Recommended because it is currently available to book.'
  }

  return 'Recommended as a popular option from the current movie catalog.'
}

async function buildTasteProfile(userId) {
  if (!userId) {
    return { preferredGenres: new Set(), watchedMovieIds: new Set() }
  }

  const [user, bookings] = await Promise.all([
    User.findById(userId).lean().catch(() => null),
    Booking.find({ userID: userId, status: 'confirmed' }).populate('movieId').lean().catch(() => []),
  ])

  const preferredGenres = new Set()
  const watchedMovieIds = new Set()

  if (Array.isArray(user?.favorites)) {
    user.favorites.forEach((favorite) => {
      const genre = normalizeGenre(favorite?.genre)
      if (genre) preferredGenres.add(genre)

      const movieId = getMovieId(favorite)
      if (movieId) watchedMovieIds.add(movieId)
    })
  }

  bookings.forEach((booking) => {
    const movie = booking.movieId
    const movieId = getMovieId(movie)
    if (movieId) watchedMovieIds.add(movieId)

    getMovieGenres(movie || {}).forEach((genre) => preferredGenres.add(genre))
  })

  return { preferredGenres, watchedMovieIds }
}

function buildFallbackRecommendations(movies, tasteProfile) {
  const preferredGenres = tasteProfile.preferredGenres || new Set()

  return movies
    .map((movie) => {
      const genres = getMovieGenres(movie)
      const genreScore = genres.some((genre) => preferredGenres.has(genre)) ? 4 : 0
      const statusScore = String(movie.status || '').toLowerCase().includes('run') ? 2 : 0
      const ratingScore = parseRatingScore(movie.rating)

      return {
        movie,
        score: genreScore + statusScore + ratingScore,
        reason: buildReason(movie, preferredGenres),
      }
    })
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ movie, reason }) => ({ movie, reason }))
}

async function buildAiRecommendations(movies, userFavorites) {
  const aiItems = await getGeminiRecommendations({
    movies,
    userFavorites,
    getMovieGenres,
  })
  const movieMap = new Map(movies.map((movie) => [movie._id, movie]))

  return aiItems
    .map((item) => {
      const movie = movieMap.get(String(item.movieId || ''))
      if (!movie) return null

      return {
        movie,
        reason: String(item.reason || 'Recommended based on your preferences.'),
      }
    })
    .filter(Boolean)
    .slice(0, MAX_RECOMMENDATIONS)
}

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''

    if (userId) {
      const sessionUser = await getSessionUser()
      const isOwner = sessionUser?._id?.toString() === userId

      if (!sessionUser || (!isOwner && sessionUser.role !== 'admin')) {
        return Response.json(
          { error: 'Forbidden.' },
          { status: 403 }
        )
      }
    }

    const movies = (await Movie.find({}).lean()).map(normalizeMovie)
    const tasteProfile = await buildTasteProfile(userId)

    // Get user's favorite movies for Gemini context
    const user = userId ? await User.findById(userId).lean().catch(() => null) : null
    const userFavorites = Array.isArray(user?.favorites) ? user.favorites : []

    let recommendations = []
    let source = 'local'

    try {
      recommendations = await buildAiRecommendations(movies, userFavorites)
      if (recommendations.length > 0) {
        source = 'ai'
        console.log(`✓ Gemini AI Recommendations: Generated ${recommendations.length} recommendations for user ${userId || 'anonymous'}`)
      } else {
        console.warn(`⚠ Gemini AI returned empty recommendations, falling back to local algorithm for user ${userId || 'anonymous'}`)
      }
    } catch (error) {
      console.error(`✗ Gemini AI Recommendation Error for user ${userId || 'anonymous'}:`, {
        message: error.message,
        stack: error.stack,
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
      })
    }

    if (recommendations.length === 0) {
      recommendations = buildFallbackRecommendations(movies, tasteProfile)
      console.log(`Using fallback recommendations: Generated ${recommendations.length} recommendations using local algorithm for user ${userId || 'anonymous'}`)
    }

    return Response.json({ recommendations, source }, { status: 200 })
  } catch (error) {
    console.error('Recommendation error:', error)
    return Response.json(
      { error: error.message || 'Failed to load recommendations' },
      { status: 500 }
    )
  }
}
