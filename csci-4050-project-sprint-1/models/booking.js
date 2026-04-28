import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
    },
    showingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showing',
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    bookingFee: {
      type: Number,
      required: true,
    },
    paymentReference: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    showtime: {
      type: String,
      default: '',
    },
    seats: {
      type: [String],
      default: [],
    },
    seatSelections: {
      type: Map,
      of: String,
      default: {},
    },
    ticketTypes: {
      adult: { type: Number, default: 0 },
      child: { type: Number, default: 0 },
      senior: { type: Number, default: 0 },
    },
    customerInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    confirmationCode: {
      type: String,
      default: '',
    },
    paymentInfo: {
      method: { type: String, default: '' },
      status: { type: String, default: 'pending' },
    },
    tickets: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
        default: [],
        ref: 'Ticket',
      },
  },
  { collection: 'Bookings', timestamps: true }
)

bookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 3600,
    partialFilterExpression: { status: 'pending' }
  }
)

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
