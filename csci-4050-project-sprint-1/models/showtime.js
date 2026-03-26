import mongoose from 'mongoose'

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Movie',
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    availableSeats: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { collection: 'Showtimes' },
)

export default mongoose.models.Showtime || mongoose.model('Showtime', showtimeSchema)
