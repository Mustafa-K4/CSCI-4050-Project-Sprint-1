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
    age_rating: {
        type: String,
        required: false,
    },
    genre: {
        type: String,
        required: false,
    },
    secondaryGenre: {
        type: String,
        required: false,
        default: '',
    },
    status: {
        type: String,
        required: false,
    },
    showtimes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Showing',
        required: false,
        default: [],
    },
    showroom: {
        type: String,
        default: 'Room A',
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
