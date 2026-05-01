import mongoose from 'mongoose'

const promotionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  promoCode: {
    type: String,
    required: true,
    unique: true,
  },
  sentAt: {
    type: Date,
    default: null,
  },
  sentToCount: {
    type: Number,
    default: 0,
  },
}, { collection: 'promotions' })

export default mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema)
