'use client';

import Link from 'next/link';
import styles from './MovieCard.module.css';

export default function MovieCard({ movie }) {
  const stars = Array(5)
    .fill(0)
    .map((_, i) => (i < Math.round(movie.rating || 0) ? '★' : '☆'));

  return (
    <div className={styles.card}>
      <img
        src={movie.poster_url}
        alt={movie.title}
        className={styles.poster}
      />

      <h3 className={styles.title}>{movie.title}</h3>

      <div className={styles.stars}>{stars.join(' ')}</div>

      <Link href={`/movies/${movie._id}`} className={styles.button}>
        View Details
      </Link>
    </div>
  );
}
