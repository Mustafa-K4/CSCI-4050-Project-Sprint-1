'use client';

import styles from './FilterBar.module.css';

export default function FilterBar({ value, onChange }) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="All">All</option>
      <option value="Action">Action</option>
      <option value="Comedy">Comedy</option>
      <option value="Drama">Drama</option>
      <option value="Animation">Animation</option>
      <option value="Sci-Fi">Sci-Fi</option>
    </select>
  );
}
