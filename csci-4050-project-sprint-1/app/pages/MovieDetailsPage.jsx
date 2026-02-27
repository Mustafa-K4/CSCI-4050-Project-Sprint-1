'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './MovieDetailsPage.module.css';

const SHOWTIMES = ['14:00', '17:00', '20:00'];
const placeholder = 'https://via.placeholder.com/400x600?text=No+Poster';

function formatTime(t) {
  const [hh, mm] = t.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour = ((hh + 11) % 12) + 1;
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export default function MovieDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/movies/${id}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => setMovie(data))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load movie');
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [id]);

  function handleShowtime(time) {
    const query = new URLSearchParams({ time });
    router.push(`/booking/${id}?${query.toString()}`);
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Link href="/" className={styles.backLink}>← Back</Link>
        <h2 className={styles.pageTitle}>Movie details</h2>
      </div>

      {loading && (
        <div className={styles.spinnerWrap}>
          <p>Loading movie...</p>
        </div>
      )}
      {error && <div className={styles.error}>Error: {error}</div>}

      {!loading && !error && movie && (
        <div className={styles.content}>
          <div className={styles.left}>
            <img
              src={movie.poster_url || placeholder}
              alt={`${movie.title} poster`}
              className={styles.poster}
            />
            <div className={styles.infoBlock}>
              <h3 className={styles.title}>{movie.title}</h3>
              <div className={styles.metaRow}>
                <span className={styles.rating}>⭐ {movie.rating ?? '—'}</span>
                <span className={styles.genre}>{movie.genre}</span>
              </div>
              <p className={styles.description}>{movie.description}</p>
            </div>
          </div>

          <div className={styles.right}>
            {movie.trailer_url && (
              <div className={styles.trailerWrap}>
                <iframe
                  src={movie.trailer_url}
                  title={`${movie.title} trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div className={styles.showtimes}>
              <h4>Showtimes</h4>
              <div className={styles.buttons}>
                {SHOWTIMES.map(t => (
                  <button key={t} className={styles.showBtn} onClick={() => handleShowtime(t)}>
                    {formatTime(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !movie && <p>No movie found.</p>}
    </div>
  );
}