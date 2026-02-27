'use client';
import React, { useState, useEffect } from 'react';
import styles from './FilterBar.module.css';

export default function FilterBar({ value, onChange }) {
  const [genres, setGenres] = useState(['All']);

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(movies => {
        const unique = ['All', ...new Set(movies.map(m => m.genre).filter(Boolean))];
        setGenres(unique);
      })
      .catch(() => setGenres(['All', 'Drama', 'Sci-Fi', 'Comedy', 'Action', 'Horror']));
  }, []);

  return (
    <div className={styles.filter}>
      <label>
        Genre
        <select value={value} onChange={e => onChange(e.target.value)}>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      <label>
        Show Date
        <select disabled>
          <option>Select Date</option>
        </select>
      </label>
    </div>
  );
}