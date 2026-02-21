import React from 'react';
import styles from './FilterBar.module.css';

const GENRES = ['All', 'Drama', 'Sci-Fi', 'Comedy'];

export default function FilterBar({ value, onChange }) {
  return (
    <div className={styles.filter}>
      <label>
        Genre
        <select value={value} onChange={e => onChange(e.target.value)}>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
    </div>
  );
}
