'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AdminPortal.module.css';

const USER_RATING_OPTIONS = ['1/5', '2/5', '3/5', '4/5', '5/5'];
const AGE_RATING_OPTIONS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
const GENRE_OPTIONS = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
];
const STATUS_OPTIONS = ['Currently Running', 'Coming Soon'];
const SECONDARY_GENRE_OPTIONS = ['None', ...GENRE_OPTIONS];

const INITIAL_FORM = {
  title: '',
  rating: USER_RATING_OPTIONS[3],
  age_rating: AGE_RATING_OPTIONS[1],
  genre: GENRE_OPTIONS[0],
  secondaryGenre: 'None',
  status: 'Currently Running',
  description: '',
  poster_url: '',
  trailer_url: '',
};

function validateMovieForm(form) {
  if (!form.title.trim()) return 'Movie title is required.';
  if (!form.rating.trim()) return 'User rating is required.';
  if (!form.age_rating.trim()) return 'Age rating is required.';
  if (!form.genre.trim()) return 'Movie genre is required.';
  if (form.secondaryGenre !== 'None' && form.secondaryGenre === form.genre) {
    return 'Please choose two different genres.';
  }
  if (!form.status.trim()) return 'Movie status is required.';
  if (!form.description.trim()) return 'Movie description is required.';
  return '';
}

export default function AdminMovieManager() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [movies, setMovies] = useState([]);
  const [editingMovieId, setEditingMovieId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadMovies() {
    setLoading(true);
    try {
      const response = await fetch('/api/movies');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load movies.');
      }
      setMovies(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load movies.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const managedMovies = useMemo(() => movies, [movies]);
  const secondaryGenreOptions = useMemo(
    () =>
      SECONDARY_GENRE_OPTIONS.map((genre) => ({
        value: genre,
        disabled: genre !== 'None' && genre === form.genre,
      })),
    [form.genre]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === 'genre') {
        return {
          ...current,
          genre: value,
          secondaryGenre: current.secondaryGenre === value ? 'None' : current.secondaryGenre,
        };
      }

      return { ...current, [name]: value };
    });
  }

  function resetFormState() {
    setForm(INITIAL_FORM);
    setEditingMovieId('');
    setError('');
    setSuccess('');
  }

  function handleEditMovie(movie) {
    setEditingMovieId(movie._id);
    setForm({
      title: movie.title || '',
      rating: movie.rating || USER_RATING_OPTIONS[3],
      age_rating: movie.age_rating || AGE_RATING_OPTIONS[1],
      genre: movie.genre || GENRE_OPTIONS[0],
      secondaryGenre: movie.secondaryGenre || 'None',
      status: movie.status || STATUS_OPTIONS[0],
      description: movie.description || '',
      poster_url: movie.poster_url || '',
      trailer_url: movie.trailer_url || '',
    });
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateMovieForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies', {
        method: editingMovieId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          secondaryGenre: form.secondaryGenre === 'None' ? '' : form.secondaryGenre,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || (editingMovieId ? 'Unable to update movie.' : 'Unable to add movie.'));
      }

      setSuccess(
        editingMovieId
          ? `"${data.title}" was updated successfully.`
          : `"${data.title}" was added successfully.`
      );
      setEditingMovieId('');
      setForm(INITIAL_FORM);
      await loadMovies();
    } catch (saveError) {
      setError(saveError.message || (editingMovieId ? 'Unable to update movie.' : 'Unable to add movie.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.twoColumnLayout}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>{editingMovieId ? 'Edit Movie' : 'Add Movie'}</h2>
            <p className={styles.sectionText}>
              {editingMovieId
                ? 'Update the selected movie listing using the same validated fields.'
                : 'Create a new movie listing with the required details. Required fields are marked clearly.'}
            </p>
          </div>
          <span className={styles.countBadge}>{managedMovies.length} Listed</span>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}
        {editingMovieId ? (
          <div className={styles.modeBanner}>
            <div>
              <p className={styles.modeBannerTitle}>Editing Current Listing</p>
              <p className={styles.modeBannerText}>
                Update the selected movie and save changes when you are finished.
              </p>
            </div>
            <span className={styles.modeTag}>Edit Mode</span>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Movie Title<span className={styles.required}>*</span>
              </span>
              <input
                className={styles.input}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter movie title"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                User Rating<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="rating"
                value={form.rating}
                onChange={handleChange}
              >
                {USER_RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Age Rating<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="age_rating"
                value={form.age_rating}
                onChange={handleChange}
              >
                {AGE_RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Primary Genre<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="genre"
                value={form.genre}
                onChange={handleChange}
              >
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Secondary Genre
              </span>
              <select
                className={styles.select}
                name="secondaryGenre"
                value={form.secondaryGenre}
                onChange={handleChange}
              >
                {secondaryGenreOptions.map((genreOption) => (
                  <option
                    key={genreOption.value}
                    value={genreOption.value}
                    disabled={genreOption.disabled}
                  >
                    {genreOption.value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Status<span className={styles.required}>*</span>
              </span>
              <select
                className={styles.select}
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Description<span className={styles.required}>*</span>
            </span>
            <textarea
              className={styles.textarea}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter a clear movie description"
            />
          </label>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Poster URL</span>
              <input
                className={styles.input}
                name="poster_url"
                value={form.poster_url}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Trailer URL</span>
              <input
                className={styles.input}
                name="trailer_url"
                value={form.trailer_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? (editingMovieId ? 'Saving Changes...' : 'Saving Movie...') : (editingMovieId ? 'Save Changes' : 'Add Movie')}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={resetFormState}
              disabled={saving}
            >
              {editingMovieId ? 'Cancel Edit' : 'Clear Form'}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Current Movie Listings</h2>
            <p className={styles.sectionText}>Review the latest movies stored in the database.</p>
          </div>
          <span className={styles.countBadge}>{managedMovies.length} Movies</span>
        </div>

        {loading ? <p className={styles.helper}>Loading movies...</p> : null}

        {!loading && managedMovies.length === 0 ? (
          <div className={styles.emptyState}>No movies have been added yet.</div>
        ) : null}

        <div className={styles.list}>
          {managedMovies.map((movie) => (
            <article
              key={movie._id}
              className={`${styles.listCard} ${editingMovieId === movie._id ? styles.activeListCard : ''}`}
            >
              <div className={styles.listTitleRow}>
                <h3 className={styles.listTitle}>{movie.title || 'Untitled Movie'}</h3>
                <span className={styles.metaPill}>{movie.status || 'Status not set'}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaPill}>
                  {[movie.genre, movie.secondaryGenre].filter(Boolean).join(' / ') || 'Genre not set'}
                </span>
                <span className={styles.metaPill}>User {movie.rating || '—'}</span>
                <span className={styles.metaPill}>Age {movie.age_rating || '—'}</span>
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => handleEditMovie(movie)}
                  disabled={editingMovieId === movie._id}
                >
                  {editingMovieId === movie._id ? 'Editing Now' : 'Edit Movie'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
