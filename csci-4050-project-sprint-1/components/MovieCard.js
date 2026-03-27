'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MovieCard.module.css';

function getStoredUserId() {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return '';

    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.id || parsedUser?._id || parsedUser?.userId || '';
  } catch {
    return '';
  }
}

export default function MovieCard({ movie }) {
  const router = useRouter();
  const placeholder = 'https://via.placeholder.com/300x450?text=No+Poster';
  const [userId, setUserId] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubmittingFavorite, setIsSubmittingFavorite] = useState(false);

  useEffect(() => {
    const currentUserId = getStoredUserId();
    setUserId(currentUserId);
  }, []);

  useEffect(() => {
    async function loadFavoriteState() {
      if (!userId || !movie?._id) {
        setIsFavorited(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (!response.ok || !data?.success) return;

        const favoriteMovies = Array.isArray(data?.user?.favoriteMovies)
          ? data.user.favoriteMovies.map(item => String(item))
          : [];

        setIsFavorited(favoriteMovies.includes(String(movie._id)));
      } catch {
        setIsFavorited(false);
      }
    }

    loadFavoriteState();
  }, [userId, movie?._id]);

  function go() {
    if (movie && movie._id) router.push(`/movies/${movie._id}`);
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') go();
  }

  async function handleFavoriteClick(event) {
    event.stopPropagation();
    event.preventDefault();

    if (!userId || !movie?._id || isSubmittingFavorite || isFavorited) return;

    setIsSubmittingFavorite(true);

    try {
      const response = await fetch(`/api/users/${userId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie._id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) return;

      const updatedFavorites = Array.isArray(data?.favoriteMovies)
        ? data.favoriteMovies.map(item => String(item))
        : [];

      setIsFavorited(updatedFavorites.includes(String(movie._id)));
    } catch {
      // Ignore request failure to avoid disrupting existing card behavior.
    } finally {
      setIsSubmittingFavorite(false);
    }
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
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorited ? styles.favoriteActive : ''}`}
          onClick={handleFavoriteClick}
          onKeyDown={event => event.stopPropagation()}
          aria-label={isFavorited ? 'Favorited' : 'Add to favorites'}
          aria-pressed={isFavorited}
          disabled={isSubmittingFavorite}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
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
