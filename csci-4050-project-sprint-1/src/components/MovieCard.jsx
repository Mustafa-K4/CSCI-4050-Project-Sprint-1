import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MovieCard.module.css';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const placeholder = 'https://via.placeholder.com/300x450?text=No+Poster';

  function go() {
    if (movie && movie.id) navigate(`/movies/${movie.id}`);
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
