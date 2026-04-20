import mongoose from 'mongoose'
import dbConnect from '../../../../database/db'
import Showing from '../../../../models/showing'
import Showroom from '../../../../models/showroom'
import Movie from '../../../../models/movie'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { error: 'Invalid showing ID format' },
        { status: 400 }
      )
    }

    await dbConnect()

    const showing = await Showing.findById(id)
      .populate('showroomID')
      .populate('showingMovie')

    if (!showing) {
      return Response.json(
        { error: 'Showing not found' },
        { status: 404 }
      )
    }

    return Response.json(showing, { status: 200 })
  } catch (error) {
    console.error('Error fetching showing:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch showing' },
      { status: 500 }
    )
  }
}
