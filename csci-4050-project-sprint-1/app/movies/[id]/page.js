'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getYouTubeEmbedUrl } from '../../../utils/videoUtils';

const placeholder = 'https://via.placeholder.com/400x600?text=No+Poster';
const DEFAULT_SHOWTIMES = ['14:00', '17:00', '20:00'];

function formatTime(t) {
  if (!t) return '—';
  const [hh, mm] = t.split(':').map(n => Number(n));
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour = ((hh + 11) % 12) + 1;
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function getStoredUserId() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id || user._id || user.userId || null;
  } catch {
    return null;
  }
}

function getFavoriteMovieId(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return String(item.movieId || item._id || item.id || '');
}

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided');
      setLoading(false);
      return;
    }

    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/movies/${id}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && typeof data === 'object') {
          setMovie(data);
        } else {
          setError('Invalid movie data received');
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load movie');
        }
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [id]);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId || !id) return;

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        const favoriteMovies = data?.user?.favoriteMovies || data?.favoriteMovies || data?.favorites || [];
        setIsFavorited(favoriteMovies.some(fav => getFavoriteMovieId(fav) === id));
      })
      .catch(err => console.error('Failed to load favorite status:', err));
  }, [id]);

  function handleShowtime(time) {
    if (!id || !time) return;
    const params = new URLSearchParams({ time });
    router.push(`/booking/${id}?${params.toString()}`);
  }

  async function handleFavoriteClick() {
    const userId = getStoredUserId();
    if (!userId || !movie || isFavorited || favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie._id })
      });
      if (response.ok) {
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Failed to add favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Link href="/" className={styles.backLink}>← Back</Link>
        <h2 className={styles.pageTitle}>Movie Details</h2>
      </div>

      {loading && <p className={styles.loading}>Loading movie...</p>}
      {error && <div className={styles.error}>Error: {error}</div>}

      {!loading && !error && movie ? (
        <div className={styles.content}>
          <div className={styles.left}>
            <img 
              src={movie?.poster_url || placeholder} 
              alt={`${movie?.title || 'Movie'} poster`} 
              className={styles.poster} 
            />
            <div className={styles.infoBlock}>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>{movie?.title || 'Untitled'}</h3>
                <button 
                  className={`${styles.favoriteButton} ${isFavorited ? styles.favoriteActive : ''}`}
                  onClick={handleFavoriteClick}
                  disabled={isFavorited || favoriteLoading}
                  title={isFavorited ? 'Added to favorites' : 'Add to favorites'}
                >
                  {isFavorited ? '♥' : '♡'}
                </button>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.rating}>⭐ {movie?.rating ?? '—'}</span>
                <span className={styles.genre}>{movie?.genre || 'Unknown'}</span>
              </div>
              <p className={styles.description}>{movie?.description || 'No description available'}</p>
            </div>
          </div>

          <div className={styles.right}>
            {movie?.trailer_url && (
              <div className={styles.trailerWrap}>
                <iframe
                  src={getYouTubeEmbedUrl(movie.trailer_url)}
                  title={`${movie?.title || 'Movie'} trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className={styles.showtimes}>
              <h4>Showtimes</h4>
              <div className={styles.buttons}>
                {(movie?.showtimes && movie.showtimes.length > 0 
                  ? movie.showtimes 
                  : DEFAULT_SHOWTIMES
                ).map(t => (
                  <button 
                    key={t} 
                    className={styles.showBtn} 
                    onClick={() => handleShowtime(t)}
                  >
                    {formatTime(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : !loading && !error ? (
        <p className={styles.noMovie}>No movie found.</p>
      ) : null}
    </div>
  );
}
