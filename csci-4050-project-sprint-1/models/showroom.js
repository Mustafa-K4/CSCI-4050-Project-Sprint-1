import mongoose from 'mongoose'

const showroomSchema = new mongoose.Schema({
  cinema: {
    type: String,
    required: true,
  },
  seatcount: {
    type: Number,
    required: true,
  },
}, { collection: 'showrooms' })

export default mongoose.models.Showroom || mongoose.model('Showroom', showroomSchema)
