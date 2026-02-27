'use client';

import React, { useState, useEffect } from 'react';
import MovieCard from '../../components/MovieCard';
import SearchBar from '../../components/SearchBar';
import FilterBar from '../../components/FilterBar';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (genre !== 'All') params.set('genre', genre);

    const url = `/api/movies${params.toString() ? `?${params}` : ''}`;

    fetch(url, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => setMovies(Array.isArray(data) ? data : []))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load movies');
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [query, genre]);

  const currentlyRunning = movies.filter(m => m.status === 'currently_running');
  const comingSoon = movies.filter(m => m.status === 'coming_soon');
  const anyMovies = currentlyRunning.length > 0 || comingSoon.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>CINEMA E‑BOOKING</h1>
      </header>

      <div className={styles.controlsRow}>
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar value={genre} onChange={setGenre} />
      </div>

      <main className={styles.content}>
        {loading && <p className={styles.statusText}>Loading movies...</p>}

        {error && (
          <div className={styles.errorBox}>
            <p>Failed to load movies. Please try again.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && !anyMovies && (
          <p className={styles.statusText}>
            {movies.length === 0 ? 'No movies available.' : 'No results found.'}
          </p>
        )}

        {!loading && !error && anyMovies && (
          <>
            {currentlyRunning.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Currently Running</h2>
                <div className={styles.movieGrid}>
                  {currentlyRunning.map(m => (
                    <MovieCard key={m._id} movie={m} />
                  ))}
                </div>
              </section>
            )}

            {comingSoon.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Coming Soon</h2>
                <div className={styles.movieGrid}>
                  {comingSoon.map(m => (
                    <MovieCard key={m._id} movie={m} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
