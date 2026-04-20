import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
    taxAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
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
