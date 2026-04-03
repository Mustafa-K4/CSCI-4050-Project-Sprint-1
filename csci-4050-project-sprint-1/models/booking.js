import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    showtime: {
      type: String,
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      default: [],
    },
    numberOfTickets: {
      type: Number,
      required: true,
      default: 0,
    },
    ticketTypes: {
      adult: { type: Number, default: 0 },
      child: { type: Number, default: 0 },
      senior: { type: Number, default: 0 },
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    customerInfo: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    confirmationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentInfo: {
      method: String,
      lastFourDigits: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
  },
  { collection: 'Bookings', timestamps: true }
)

// Index to automatically delete expired bookings
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
