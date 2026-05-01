'use client'

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MovieCard from '../components/MovieCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import styles from './HomePage.module.css';

export default function HomePage() {
  const router = useRouter();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [externalSearchResults, setExternalSearchResults] = useState(null);

  useEffect(() => {
    async function loadCurrentUser() {
      setAuthLoading(true);
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          setCurrentUser(null);
          localStorage.removeItem('user');
          return;
        }

        const user = await response.json();
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/movies', { signal: ctl.signal })
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

  useEffect(() => {
    if (loading || authLoading || movies.length === 0) return;

    const ctl = new AbortController();
    const userId = currentUser?.id || currentUser?._id || currentUser?.userId || '';
    const queryString = userId ? `?userId=${encodeURIComponent(userId)}` : '';

    setRecommendationsLoading(true);

    fetch(`/api/recommendations${queryString}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Recommendation error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const incoming = Array.isArray(data?.recommendations) ? data.recommendations : [];
        setRecommendations(incoming);
        if (data?.source === 'ai') {
          console.log('✓ AI Recommendations loaded successfully', { count: incoming.length, source: data.source });
        } else if (data?.source === 'local') {
          console.log('⚠ Using fallback recommendations (AI service unavailable)', { count: incoming.length, source: data.source });
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('✗ Failed to load recommendations:', err.message);
          setRecommendations([]);
        }
      })
      .finally(() => setRecommendationsLoading(false));

    return () => ctl.abort();
  }, [loading, authLoading, movies.length, currentUser]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = externalSearchResults !== null ? externalSearchResults : movies;

    return source.filter(m => {
      const matchesQuery =
        externalSearchResults !== null
          ? true
          : (!q ||
              (m.title || '').toLowerCase().includes(q) ||
              (m.description || '').toLowerCase().includes(q));

      const matchesGenre =
        genre === 'All' ||
        (m.genre || '') === genre ||
        (m.secondaryGenre || '') === genre;

      return matchesQuery && matchesGenre;
    });
  }, [movies, query, genre, externalSearchResults]);

  const currentlyRunning = filtered.filter(m =>
    (m.status || '').toLowerCase().includes('run')
  );
  const comingSoon = filtered.filter(m =>
    (m.status || '').toLowerCase().includes('coming')
  );

  const anyMovies = currentlyRunning.length > 0 || comingSoon.length > 0;
  const featuredMovie = currentlyRunning[0] || comingSoon[0] || movies[0] || null;
  const showingCount = movies.filter(m => (m.status || '').toLowerCase().includes('run')).length;
  const upcomingCount = movies.filter(m => (m.status || '').toLowerCase().includes('coming')).length;
  const activeFilterCount = query.trim() || genre !== 'All' ? filtered.length : movies.length;
  const recommendationItems = recommendations
    .map(item => ({
      movie: item?.movie,
      reason: item?.reason || 'Recommended based on current movie activity.',
    }))
    .filter(item => item.movie?._id);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('user');
      setCurrentUser(null);
      router.refresh();
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Cinema E-Booking home">
          <span className={styles.brandMark}>CE</span>
          <span>
            <span className={styles.brandName}>Cinema E-Booking</span>
            <span className={styles.brandSubline}>Tickets, showtimes, and movie nights</span>
          </span>
        </Link>

        <nav className={styles.authButtons} aria-label="Account navigation">
          {authLoading ? null : currentUser ? (
            <>
              <span className={styles.userLabel}>
                {currentUser.name || currentUser.email}
              </span>
              {currentUser.role === 'admin' ? (
                <Link href="/admin" className={styles.adminButton}>
                  Admin Portal
                </Link>
              ) : null}
              <Link href="/profile" className={styles.secondaryButton}>
                Profile
              </Link>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              Login
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section
          className={styles.hero}
          style={
            featuredMovie?.poster_url
              ? { '--hero-poster': `url("${featuredMovie.poster_url}")` }
              : undefined
          }
        >
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Now booking online</p>
            <h1>Find your next movie night.</h1>
            <p className={styles.heroText}>
              Browse current movies, check upcoming releases, and jump straight into showtimes
              without digging through extra pages.
            </p>

            <div className={styles.heroActions}>
              {featuredMovie?._id ? (
                <Link href={`/movies/${featuredMovie._id}`} className={styles.primaryHeroButton}>
                  View Featured Movie
                </Link>
              ) : null}
              <a href="#movies" className={styles.secondaryHeroButton}>
                Browse Movies
              </a>
            </div>
          </div>

          <aside className={styles.featurePanel} aria-label="Featured movie">
            {featuredMovie?.poster_url ? (
              <div className={styles.featurePosterWrap}>
                <img
                  src={featuredMovie.poster_url}
                  alt={`${featuredMovie?.title || 'Featured movie'} poster`}
                  className={styles.featurePoster}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : null}
            <span className={styles.featureLabel}>Featured</span>
            <h2>{featuredMovie?.title || 'Movies loading soon'}</h2>
            <p>
              {[featuredMovie?.genre, featuredMovie?.age_rating, featuredMovie?.status]
                .filter(Boolean)
                .join(' • ') || 'Check available movies below.'}
            </p>
          </aside>
        </section>

        <section className={styles.searchPanel} aria-label="Search and filter movies">
          <div>
            <p className={styles.panelLabel}>Quick Find</p>
            <h2>Search movies and filter by genre</h2>
          </div>
          <div className={styles.controls}>
            <SearchBar
              value={query}
              onChange={v => setQuery(v)}
              onResults={results => setExternalSearchResults(results)}
            />
            <FilterBar value={genre} onChange={setGenre} />
          </div>
        </section>

        <section className={styles.statsRow} aria-label="Movie counts">
          <div className={styles.statCard}>
            <span>{showingCount}</span>
            <p>Now Showing</p>
          </div>
          <div className={styles.statCard}>
            <span>{upcomingCount}</span>
            <p>Coming Soon</p>
          </div>
          <div className={styles.statCard}>
            <span>{activeFilterCount}</span>
            <p>{query.trim() || genre !== 'All' ? 'Matching Results' : 'Total Movies'}</p>
          </div>
        </section>

        <section id="movies" className={styles.moviesArea}>
          {loading && <div className={styles.stateCard}>Loading movies...</div>}

          {error && (
            <div className={styles.stateCard} role="alert">
              <p>Error: {error}</p>
              <button type="button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !anyMovies && (
            <div className={styles.stateCard}>No movies match the current search.</div>
          )}

          {!loading && !error && anyMovies && (
            <>
              {recommendationsLoading || recommendationItems.length > 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.panelLabel}>AI-assisted picks</p>
                      <h2>Recommended For You</h2>
                    </div>
                    <span>{recommendationsLoading ? 'Loading' : `${recommendationItems.length} picks`}</span>
                  </div>

                  {recommendationsLoading ? (
                    <div className={styles.stateCard}>Loading recommendations...</div>
                  ) : (
                    <div className={styles.recommendationGrid}>
                      {recommendationItems.map(({ movie, reason }) => (
                        <div key={`recommendation-${movie._id}`} className={styles.recommendationItem}>
                          <MovieCard movie={movie} />
                          <p className={styles.recommendationReason}>{reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {currentlyRunning.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.panelLabel}>Book today</p>
                      <h2>Now Showing</h2>
                    </div>
                    <span>{currentlyRunning.length} movies</span>
                  </div>
                  <div className={styles.movieGrid}>
                    {currentlyRunning.map(m => (
                      <MovieCard key={m._id} movie={m} />
                    ))}
                  </div>
                </section>
              )}

              {comingSoon.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.panelLabel}>Plan ahead</p>
                      <h2>Coming Soon</h2>
                    </div>
                    <span>{comingSoon.length} movies</span>
                  </div>
                  <div className={styles.movieGrid}>
                    {comingSoon.map(m => (
                      <MovieCard key={m._id} movie={m} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
