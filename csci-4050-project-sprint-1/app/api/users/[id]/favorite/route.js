import dbConnect from '../../../../../database/db'
import User from '../../../../../models/user'

export async function POST(request, { params }) {
  try {
    await dbConnect()

    const userId = params?.id
    const body = await request.json()
    const movieId = body?.movieId ? String(body.movieId).trim() : ''

    if (!userId || !movieId) {
      return Response.json(
        { success: false, error: 'user id and movieId are required' },
        { status: 400 },
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const existingFavorites = Array.isArray(user.favoriteMovies)
      ? user.favoriteMovies.map(item => String(item))
      : []

    if (!existingFavorites.includes(movieId)) {
      user.favoriteMovies = [...existingFavorites, movieId]
      await user.save()
    }

    return Response.json(
      {
        success: true,
        favoriteMovies: user.favoriteMovies || [],
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error adding favorite movie:', error)

    if (error?.name === 'CastError') {
      return Response.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    return Response.json(
      { success: false, error: error.message || 'Failed to add favorite movie' },
      { status: 500 },
    )
  }
}
