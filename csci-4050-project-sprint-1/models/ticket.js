import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Booking',
  },
  price: {
    type: Number,
    required: true,
  },
  seat: {
    type: String,
    required: true,
  },
  ticketType: {
    type: String,
    required: true,
  },
}, { collection: 'tickets' })

export default mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema)
