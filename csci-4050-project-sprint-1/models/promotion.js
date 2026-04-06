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
}, { collection: 'promotions' })

export default mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema)
