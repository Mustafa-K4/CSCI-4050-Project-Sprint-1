const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGO_URI;

const movieSchema = new mongoose.Schema({
  title: String,
  rating: String,
  genre: String,
  status: String,
  description: String,
  poster_url: String,
  trailer_url: String,
  showtimes: [String],
}, { collection: 'Movies' });

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

const movies = [
  {
    title: 'Inside Out 2',
    rating: 'PG',
    genre: 'Comedy',
    status: 'currently_running',
    description: 'Riley enters adolescence and new emotions arrive in her mind, causing conflict with the original emotions.',
    poster_url: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    trailer_url: 'https://www.youtube.com/embed/LEjhY15eCx0',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Black Panther',
    rating: 'PG-13',
    genre: 'Action',
    status: 'currently_running',
    description: 'T\'Challa returns home to Wakanda to take his place as king, but finds his sovereignty challenged by a powerful enemy.',
    poster_url: 'https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
    trailer_url: 'https://www.youtube.com/embed/xjDjIWPwcPU',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Howl\'s Moving Castle',
    rating: 'PG',
    genre: 'Animation',
    status: 'currently_running',
    description: 'A young woman cursed with an old body seeks the help of a wizard named Howl and gets caught up in his world.',
    poster_url: 'https://www.google.com/imgres?q=howl%20moving%20castle%20poster&imgurl=https%3A%2F%2Fi.ebayimg.com%2Fimages%2Fg%2Fh9oAAOSw0BJgHam1%2Fs-l1200.jpg&imgrefurl=https%3A%2F%2Fwww.ebay.com%2Fitm%2F174626246909&docid=GhwgUq8H4Hd0PM&tbnid=_1FCZtOJ-neVyM&vet=12ahUKEwjbxYegn_qSAxVy5MkDHXFWEEkQnPAOegQIHhAB..i&w=720&h=1015&hcb=2&ved=2ahUKEwjbxYegn_qSAxVy5MkDHXFWEEkQnPAOegQIHhAB',
    trailer_url: 'https://www.youtube.com/embed/iwROgK94zcM',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Barbie',
    rating: 'PG-13',
    genre: 'Comedy',
    status: 'currently_running',
    description: 'Barbie and Ken leave Barbieland for the real world after Barbie starts having thoughts about death.',
    poster_url: 'https://www.google.com/imgres?q=barbie%20movie%20poster%202023&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F0%2F0b%2FBarbie_2023_poster.jpg&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FBarbie_(film)&docid=nEDRqY7v0cgTzM&tbnid=tNHikVeh_yz_zM&vet=12ahUKEwjdhIyUn_qSAxVdHNAFHd6BO44QnPAOegQIGBAB..i&w=250&h=375&hcb=2&ved=2ahUKEwjdhIyUn_qSAxVdHNAFHd6BO44QnPAOegQIGBAB',
    trailer_url: 'https://www.youtube.com/embed/pBk4NYhWNMM',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'The Godfather',
    rating: 'R',
    genre: 'Drama',
    status: 'currently_running',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.',
    poster_url: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLLeHOJZ4FaA.jpg',
    trailer_url: 'https://www.youtube.com/embed/sY1S34973zA',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Dune: Part Two',
    rating: 'PG-13',
    genre: 'Sci-Fi',
    status: 'currently_running',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailer_url: 'https://www.youtube.com/embed/Way9Dexny3w',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Rush Hour',
    rating: 'PG-13',
    genre: 'Comedy',
    status: 'coming_soon',
    description: 'A Hong Kong detective teams up with a loudmouth LAPD officer to rescue the Chinese consul\'s kidnapped daughter.',
    poster_url: 'https://www.google.com/imgres?q=rush%20%20hour%20movie%20poster&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F4%2F49%2FRush_Hour_poster.png&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FRush_Hour_(1998_film)&docid=r2RnJnUJWiDmaM&tbnid=mQ8A4fH1Ri8vNM&vet=12ahUKEwi8yNDXnvqSAxU1xskDHRwoCZEQnPAOegQIHhAB..i&w=261&h=384&hcb=2&ved=2ahUKEwi8yNDXnvqSAxU1xskDHRwoCZEQnPAOegQIHhAB',
    trailer_url: 'https://www.youtube.com/embed/K5ZBZB4Kuo8',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Oppenheimer',
    rating: 'R',
    genre: 'Drama',
    status: 'coming_soon',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailer_url: 'https://www.youtube.com/embed/uYPbbksJxIg',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'Demon Slayer: Infinity Castle',
    rating: 'R',
    genre: 'Animation',
    status: 'coming_soon',
    description: 'Tanjiro and his allies face the most powerful demons yet in a battle that will determine the fate of humanity.',
    poster_url: 'https://www.google.com/imgres?q=demon%20slayer%20movie%20poster&imgurl=https%3A%2F%2Fcdn11.bigcommerce.com%2Fs-yzgoj%2Fimages%2Fstencil%2F1280x1280%2Fproducts%2F2912787%2F5957148%2FMOVCB36165__11095.1679600910.jpg%3Fc%3D2&imgrefurl=https%3A%2F%2Fwww.posterazzi.com%2Fdemon-slayer-the-movie-mugen-train-movie-poster-print-27-x-40-item-movcb36165%2F%3Fsrsltid%3DAfmBOoogd1bzrEDq2OaXZE86k2DHyQ-hEQx4TMUR_tSFfBcPO_-JXd_V&docid=vv3f3vkoTLrVsM&tbnid=xFryxo_gV5_v4M&vet=12ahUKEwjY29_5nvqSAxXf5MkDHQ7dNZ0QnPAOegQIFhAB..i&w=905&h=1280&hcb=2&ved=2ahUKEwjY29_5nvqSAxXf5MkDHQ7dNZ0QnPAOegQIFhAB',
    trailer_url: 'https://www.youtube.com/embed/3GBnKpxiVGI',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'The Avengers',
    rating: 'PG-13',
    genre: 'Action',
    status: 'coming_soon',
    description: 'Earth\'s mightiest heroes must come together to stop Loki and his alien army from enslaving humanity.',
    poster_url: 'https://www.google.com/imgres?q=the%20avengers%20movie%20poster&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F8a%2FThe_Avengers_%25282012_film%2529_poster.jpg&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FThe_Avengers_(2012_film)&docid=zQuIjGmJr-eC6M&tbnid=gu6TyfpjLCfGYM&vet=12ahUKEwjs_9mFn_qSAxUd58kDHWraCskQnPAOegQIHRAB..i&w=220&h=326&hcb=2&ved=2ahUKEwjs_9mFn_qSAxUd58kDHWraCskQnPAOegQIHRAB',
    trailer_url: 'https://www.youtube.com/embed/eOrNdBpGMv8',
    showtimes: ['14:00', '17:00', '20:00'],
  },
];
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await Movie.deleteMany({});
    console.log('Cleared existing movies');
    await Movie.insertMany(movies);
    console.log(`Seeded ${movies.length} movies`);
    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {``
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();