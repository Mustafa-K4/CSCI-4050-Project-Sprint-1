'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getYouTubeEmbedUrl } from '../../../utils/videoUtils';

const SHOWTIMES = ['14:00', '17:00', '20:00'];
const placeholder = 'https://via.placeholder.com/400x600?text=No+Poster';

function formatTime(t) {
  if (!t) return '—';
  const [hh, mm] = t.split(':').map(n => Number(n));
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour = ((hh + 11) % 12) + 1;
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [favMessage, setFavMessage] = useState('');

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;

    try {
      const parsedUser = JSON.parse(rawUser);
      const parsedId = parsedUser?.id || parsedUser?._id || '';
      if (parsedId) setUserId(parsedId);
    } catch {
      setUserId('');
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided');
      setLoading(false);
      return;
    }

    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`http://localhost:3000/api/movies/${id}`, { signal: ctl.signal })
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
    if (!id || !userId) return;

    const ctl = new AbortController();

    fetch(`/api/users/${userId}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const profile = data?.user || {};
        const favorites = Array.isArray(profile.favoriteMovies)
          ? profile.favoriteMovies
          : Array.isArray(profile.favorites)
            ? profile.favorites
            : [];

        const favoriteIds = favorites.map(item => (typeof item === 'string' ? item : String(item?._id || item?.id || '')));
        setIsFavorite(favoriteIds.includes(String(id)));
      })
      .catch(() => {
        setIsFavorite(false);
      });

    return () => ctl.abort();
  }, [id, userId]);

  async function handleFavoriteClick() {
    if (!id) return;

    if (!userId) {
      setFavMessage('Please log in to favorite movies.');
      return;
    }

    setFavLoading(true);
    setFavMessage('');

    try {
      const response = await fetch(`/api/users/${userId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: id }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        setFavMessage(data?.error || 'Failed to add favorite');
        return;
      }

      setIsFavorite(true);
      setFavMessage('Added to favorites.');
    } catch (requestError) {
      setFavMessage(requestError.message || 'Failed to add favorite');
    } finally {
      setFavLoading(false);
    }
  }

  function handleShowtime(time) {
    if (!id || !time) return;
    const params = new URLSearchParams({ time });
    router.push(`/booking/${id}?${params.toString()}`);
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
                  type="button"
                  className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                  onClick={handleFavoriteClick}
                  disabled={favLoading}
                  aria-label={isFavorite ? 'Favorited' : 'Add to favorites'}
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.rating}>⭐ {movie?.rating ?? '—'}</span>
                <span className={styles.genre}>{movie?.genre || 'Unknown'}</span>
              </div>
              {favMessage && <p className={styles.favoriteMessage}>{favMessage}</p>}
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
                {SHOWTIMES.map(t => (
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
