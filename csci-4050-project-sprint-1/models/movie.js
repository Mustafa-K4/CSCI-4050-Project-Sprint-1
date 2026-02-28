import mongoose from 'mongoose'

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
    },
    poster_url: {
        type: String,
        required: false,
    },
    rating: {
        type: String,
        required: false,
    },
    genre: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: false,
    },
    showtimes: {
        type: [String],
        required: false,
    },
     description: {
        type: String,
        required: false,
    },
     trailer_url: {
        type: String,
        required: false,
    },
}, { collection: 'Movies' })

export default mongoose.models.Movie || mongoose.model('Movie', movieSchema)