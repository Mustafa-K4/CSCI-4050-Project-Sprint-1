'use client';

import React, { useEffect, useState } from 'react';
import styles from './MovieDetailsPage.module.css';
import Link from 'next/link';

export default function MovieDetailsPage({ params }) {
  const { id } = params;
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => setMovie(data))
      .catch(err => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Link href="/" className={styles.back}>← Back</Link>
        <p className={styles.errorText}>Error: {error}</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>← Back</Link>

      <div className={styles.card}>
        <img src={movie.poster_url} alt={movie.title} className={styles.poster} />

        <div className={styles.info}>
          <h1 className={styles.title}>{movie.title}</h1>
          <p className={styles.meta}>
            <span>{movie.rating}</span> • <span>{movie.genre}</span>
          </p>

          <p className={styles.description}>{movie.description}</p>

          <h3 className={styles.showtimeHeader}>Showtimes</h3>
          <div className={styles.showtimes}>
            {movie.showtimes.map((time, index) => (
              <Link
                key={index}
                href={`/booking/${movie._id}?time=${time}`}
                className={styles.showtimeButton}
              >
                {time}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.trailerSection}>
        <h2 className={styles.trailerHeader}>Trailer</h2>
        <iframe
          className={styles.trailer}
          src={movie.trailer_url}
          title="Movie Trailer"
          allowFullScreen
        />
      </div>
    </div>
  );
}
