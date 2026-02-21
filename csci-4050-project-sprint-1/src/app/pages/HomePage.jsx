import React, { useState, useEffect, useMemo } from 'react';
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
  const [externalSearchResults, setExternalSearchResults] = useState(null);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch('http://localhost:5000/movies', { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load movies');
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = externalSearchResults !== null ? externalSearchResults : movies;
    return source.filter(m => {
      const matchesQuery = externalSearchResults !== null ? true : (!q || (m.title || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q));
      const matchesGenre = genre === 'All' || (m.genre || '') === genre;
      return matchesQuery && matchesGenre;
    });
  }, [movies, query, genre, externalSearchResults]);

  const currentlyRunning = filtered.filter(m => (m.status || '').toLowerCase().includes('run'));
  const comingSoon = filtered.filter(m => (m.status || '').toLowerCase().includes('coming'));

  const anyMovies = currentlyRunning.length > 0 || comingSoon.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cinema E-Booking System</h1>
      </header>

      <section className={styles.controls}>
        <SearchBar value={query} onChange={v => { setQuery(v); }} onResults={results => setExternalSearchResults(results)} />
        <FilterBar value={genre} onChange={setGenre} />
      </section>

      <section className={styles.grid}>
        {loading && <p>Loading movies...</p>}
        {error && (
          <div>
            <p style={{ color: 'crimson' }}>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && !anyMovies && <p>No movies available.</p>}

        {!loading && !error && anyMovies && (
          <>
            {currentlyRunning.length > 0 && (
              <section className={styles.section}>
                <h2>Currently Running</h2>
                <div className={styles.grid}>
                  {currentlyRunning.map(m => <MovieCard key={m.id} movie={m} />)}
                </div>
              </section>
            )}

            {comingSoon.length > 0 && (
              <section className={styles.section}>
                <h2>Coming Soon</h2>
                <div className={styles.grid}>
                  {comingSoon.map(m => <MovieCard key={m.id} movie={m} />)}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </div>
  );
}
