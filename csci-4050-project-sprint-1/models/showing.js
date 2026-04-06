import mongoose from 'mongoose'

const showingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  showroomID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Showroom',
  },
  showingMovie: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Movie',
  },
  time: {
    type: String,
    required: true,
  },
}, { collection: 'showings' })

export default mongoose.models.Showing || mongoose.model('Showing', showingSchema)
