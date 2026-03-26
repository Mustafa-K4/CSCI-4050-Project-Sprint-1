import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    pswrd: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    payments: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    no_payments: {
      type: String,
      default: '0',
    },
    verification: {
      type: String,
      default: 'unverified',
      trim: true,
    },
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    favorites: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { collection: 'Users', timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
