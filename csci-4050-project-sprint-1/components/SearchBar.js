import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value: propValue = '', onChange, onResults }) {
  const [value, setValue] = useState(propValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const timer = useRef(null);
  const ctl = useRef(null);

  useEffect(() => setValue(propValue), [propValue]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (ctl.current) ctl.current.abort();
    };
  }, []);

  function handleInput(v) {
    setValue(v);
    if (onChange) onChange(v);

    // Debounce search
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => performSearch(v), 400);
  }

  function performSearch(q) {
    // Empty query -> clear external search results
    if (!q || !q.trim()) {
      setNoResults(false);
      setError(null);
      setLoading(false);
      if (onResults) onResults(null);
      return;
    }

    if (ctl.current) ctl.current.abort();
    ctl.current = new AbortController();
    setLoading(true);
    setError(null);
    setNoResults(false);

    fetch(`http://localhost:5000/movies/search?title=${encodeURIComponent(q)}`, { signal: ctl.current.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const results = Array.isArray(data) ? data : [];
        if (results.length === 0) setNoResults(true);
        else setNoResults(false);
        if (onResults) onResults(results);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Search failed');
        if (onResults) onResults([]);
      })
      .finally(() => setLoading(false));
  }

  function onSubmit(e) {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    performSearch(value);
  }

  return (
    <div className={styles.search}>
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          placeholder="Search movies..."
          value={value}
          onChange={e => handleInput(e.target.value)}
          aria-label="Search movies"
        />
        <button type="submit" className={styles.btn} aria-label="Search">Search</button>
      </form>

      {loading && <div className={styles.hint}>Searching…</div>}
      {error && <div className={styles.hint} style={{ color: 'crimson' }}>{error}</div>}
      {!loading && noResults && <div className={styles.hint}>No matching movies found.</div>}
    </div>
  );
}
