'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './MovieCard.module.css';

export default function MovieCard({ movie }) {
  const router = useRouter();
  const placeholder = 'https://via.placeholder.com/300x450?text=No+Poster';

  function go() {
    if (movie && movie._id) router.push(`/movies/${movie._id}`);
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') go();
  }

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKey}
      aria-label={`Open details for ${movie?.title || 'movie'}`}
    >
      <div className={styles.posterWrap}>
        <img
          src={movie?.poster_url || placeholder}
          alt={`${movie?.title || 'Movie'} poster`}
          className={styles.poster}
          loading="lazy"
        />
        <div className={styles.rating}>{movie?.rating ?? '—'}</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{movie?.title}</h3>
      </div>
    </article>
  );
}
