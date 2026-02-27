import React from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange }) {
  return (
    <div className={styles.search}>
      <form onSubmit={e => e.preventDefault()} className={styles.form}>
        <input
          placeholder="Search movies..."
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Search movies"
        />
        <button type="submit" className={styles.btn} aria-label="Search">
          Search
        </button>
      </form>
    </div>
  );
}