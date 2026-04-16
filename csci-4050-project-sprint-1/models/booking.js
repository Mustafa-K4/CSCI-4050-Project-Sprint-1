import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    bookingDate: {
      type: Date,
      required: true,
    },
    bookingFee: {
      type: String,
      required: true,
    },
    paymentReference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
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
