import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../../database/db'
import Movie from '../../../../../models/movie'
import User from '../../../../../models/user'
import { getSessionUser } from '../../../../../lib/auth/current-user'

function getFavoriteMovieId(item) {
  if (!item) {
    return ''
  }

  if (typeof item === 'string') {
    return item
  }

  return String(item.movieId || item._id || item.id || '')
}

export async function POST(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })
    }

    if (sessionUser._id.toString() !== id && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json()
    const movieId = String(body.movieId || '').trim()
    if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
      return NextResponse.json({ error: 'Valid movie id is required.' }, { status: 400 })
    }

    await dbConnect()
    const [user, movie] = await Promise.all([
      User.findById(id),
      Movie.findById(movieId),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found.' }, { status: 404 })
    }

    const existingFavoriteIds = Array.isArray(user.favorites)
      ? user.favorites.map(getFavoriteMovieId).filter(Boolean)
      : []

    if (!existingFavoriteIds.includes(movieId)) {
      user.favorites = [
        ...(Array.isArray(user.favorites) ? user.favorites : []),
        {
          movieId,
          title: movie.title || '',
          genre: movie.genre || '',
          rating: movie.rating || '',
          poster_url: movie.poster_url || '',
        },
      ]
      await user.save()
    }

    const favoriteMovies = Array.isArray(user.favorites)
      ? user.favorites
          .map((item) => ({
            movieId: getFavoriteMovieId(item),
            title: item?.title || '',
            genre: item?.genre || '',
            rating: item?.rating || '',
            poster_url: item?.poster_url || '',
          }))
          .filter((item) => item.movieId)
      : []

    return NextResponse.json(
      {
        success: true,
        favoriteMovies,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to add favorite movie.' },
      { status: 500 }
    )
  }
}
