'use client';

import React, { useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cinema E-Booking System</h1>
      </header>

      <section className={styles.controls}>
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar value={genre} onChange={setGenre} />
      </section>

      <section className={styles.grid}>
        {loading && <p>Loading movies...</p>}

        {error && (
          <div>
            <p style={{ color: 'crimson' }}>Failed to load movies. Please try again.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && !anyMovies && (
          <p>{movies.length === 0 ? 'No movies available.' : 'No results found.'}</p>
        )}

        {!loading && !error && anyMovies && (
          <>
            {currentlyRunning.length > 0 && (
              <section className={styles.section}>
                <h2>Currently Running</h2>
                <div className={styles.grid}>
                  {currentlyRunning.map(m => <MovieCard key={m._id} movie={m} />)}
                </div>
              </section>
            )}
            {comingSoon.length > 0 && (
              <section className={styles.section}>
                <h2>Coming Soon</h2>
                <div className={styles.grid}>
                  {comingSoon.map(m => <MovieCard key={m._id} movie={m} />)}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </div>
  );
}
