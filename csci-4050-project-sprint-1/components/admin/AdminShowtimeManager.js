'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AdminPortal.module.css';

const INITIAL_FORM = {
  showingMovie: '',
  date: '',
  time: '',
  showroomID: '',
};

function formatDate(value) {
  if (!value) return 'No date set';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function validateShowtimeForm(form) {
  if (!form.showingMovie) return 'Please select a movie.';
  if (!form.date) return 'Please select a show date.';
  if (!form.time) return 'Please select a show time.';
  if (!form.showroomID) return 'Please select a showroom.';
  return '';
}

export default function AdminShowtimeManager() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [movies, setMovies] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadAdminData() {
    setLoading(true);
    try {
      const [moviesResponse, showroomsResponse, showingsResponse] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/showrooms'),
        fetch('/api/showings'),
      ]);

      const [moviesData, showroomsData, showingsData] = await Promise.all([
        moviesResponse.json(),
        showroomsResponse.json(),
        showingsResponse.json(),
      ]);

      if (!moviesResponse.ok) {
        throw new Error(moviesData?.error || 'Unable to load movies.');
      }

      if (!showroomsResponse.ok) {
        throw new Error(showroomsData?.error || 'Unable to load showrooms.');
      }

      if (!showingsResponse.ok) {
        throw new Error(showingsData?.error || 'Unable to load showtimes.');
      }

      setMovies(Array.isArray(moviesData) ? moviesData : []);
      setShowrooms(Array.isArray(showroomsData) ? showroomsData : []);
      setShowings(Array.isArray(showingsData) ? showingsData : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load admin scheduling data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const movieOptions = useMemo(() => movies.filter((movie) => movie?._id), [movies]);
  const recentShowings = useMemo(() => showings.slice(0, 10), [showings]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateShowtimeForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/showings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to schedule showtime.');
      }

      setSuccess('Showtime scheduled successfully.');
      setForm(INITIAL_FORM);
      await loadAdminData();
    } catch (saveError) {
      setError(saveError.message || 'Unable to schedule showtime.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.twoColumnLayout}>
      <div className={styles.stack}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Schedule a Movie</h2>
              <p className={styles.sectionText}>
                Select a movie, date, time, and available showroom. The system blocks duplicate
                bookings for the same showroom at the same date and time.
              </p>
            </div>
            <span className={styles.countBadge}>{movieOptions.length} Movies</span>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {success ? <div className={styles.success}>{success}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>
                Movie<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="showingMovie"
                value={form.showingMovie}
                onChange={handleChange}
                disabled={movieOptions.length === 0}
              >
                <option value="">Select a movie</option>
                {movieOptions.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Date<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Time<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>
                Showroom<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="showroomID"
                value={form.showroomID}
                onChange={handleChange}
              >
                <option value="">Select a showroom</option>
                {showrooms.map((showroom) => (
                  <option key={showroom._id} value={showroom._id}>
                    {showroom.cinema} • {showroom.seatcount} seats
                  </option>
                ))}
              </select>
            </label>

            {movieOptions.length === 0 ? (
              <p className={styles.helper}>
                Add at least one movie before scheduling showtimes.
              </p>
            ) : null}

            <div className={styles.buttonRow}>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={saving || movieOptions.length === 0}
              >
                {saving ? 'Scheduling...' : 'Add Showtime'}
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={saving}
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setError('');
                  setSuccess('');
                }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Available Showrooms</h2>
              <p className={styles.sectionText}>
                The system keeps at least three showrooms available for scheduling.
              </p>
            </div>
            <span className={styles.countBadge}>{showrooms.length} Rooms</span>
          </div>

          <div className={styles.showroomList}>
            {showrooms.map((showroom) => (
              <div key={showroom._id} className={styles.showroomItem}>
                <strong>{showroom.cinema}</strong>
                <span>{showroom.seatcount} seats</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Scheduled Showtimes</h2>
            <p className={styles.sectionText}>Review the current schedule and any conflict messages.</p>
          </div>
          <span className={styles.countBadge}>{recentShowings.length} Showtimes</span>
        </div>

        {loading ? <p className={styles.helper}>Loading showtimes...</p> : null}

        {!loading && recentShowings.length === 0 ? (
          <div className={styles.emptyState}>No showtimes have been scheduled yet.</div>
        ) : null}

        <div className={styles.list}>
          {recentShowings.map((showing) => (
            <article key={showing._id} className={styles.listCard}>
              <div className={styles.listTitleRow}>
                <h3 className={styles.listTitle}>
                  {showing?.showingMovie?.title || 'Movie not found'}
                </h3>
                <span className={styles.metaPill}>{showing?.time || 'No time set'}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaPill}>{formatDate(showing?.date)}</span>
                <span className={styles.metaPill}>
                  {showing?.showroomID?.cinema || 'Showroom not set'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
