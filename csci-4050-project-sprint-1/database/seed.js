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
    title: 'Spider-Man: Far From Home',
    rating: 'PG-13',
    genre: 'Action',
    status: 'currently_running',
    description: 'Peter Parker goes on a school trip to Europe, but his plans are interrupted when Nick Fury recruits him to battle mysterious elemental creatures alongside the enigmatic Mysterio.',
    poster_url: 'https://image.tmdb.org/t/p/w500/4q2NNj4S5dG2RLF9CpXsej7yXl.jpg', // keep this URL
    trailer_url: 'https://www.youtube.com/embed/Nt9L1jCKGnE',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  
  {
    title: 'Barbie',
    rating: 'PG-13',
    genre: 'Comedy',
    status: 'currently_running',
    description: 'Barbie and Ken leave Barbieland for the real world after Barbie starts having thoughts about death.',
    poster_url: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    trailer_url: 'https://www.youtube.com/embed/pBk4NYhWNMM',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'The Super Mario Bros. Movie',
    rating: 'PG',
    genre: 'Animation',
    status: 'currently_running',
    description: 'Mario and Luigi enter the Mushroom Kingdom to stop Bowser from taking over the world.',
    poster_url: 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
    trailer_url: 'https://www.youtube.com/embed/TnGl01FkMMo',
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
    poster_url: 'https://image.tmdb.org/t/p/w500/we7wOLVFgxhzLzUt0qNe50xdIQZ.jpg',
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
    poster_url: 'https://image.tmdb.org/t/p/w500/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg',
    trailer_url: 'https://www.youtube.com/embed/3GBnKpxiVGI',
    showtimes: ['14:00', '17:00', '20:00'],
  },
  {
    title: 'The Avengers',
    rating: 'PG-13',
    genre: 'Action',
    status: 'coming_soon',
    description: 'Earth\'s mightiest heroes must come together to stop Loki and his alien army from enslaving humanity.',
    poster_url: 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
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