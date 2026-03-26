import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
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
    favorites: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { collection: 'Users' }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
