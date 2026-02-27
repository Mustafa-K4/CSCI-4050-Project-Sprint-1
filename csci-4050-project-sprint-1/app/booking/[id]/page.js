'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const PRICES = { adult: 12, child: 8, senior: 10 };

function formatTime(t) {
  if (!t) return '—';
  const [hh, mm] = t.split(':').map(n => Number(n));
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour = ((hh + 11) % 12) + 1;
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const id = params?.id;
  const selectedTime = searchParams?.get('time') || '';

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const [senior, setSenior] = useState(0);

  const [selectedSeats, setSelectedSeats] = useState(new Set());

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided');
      setLoading(false);
      return;
    }

    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`http://localhost:3000/api/movies/${id}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && typeof data === 'object') {
          setMovie(data);
        } else {
          setError('Invalid movie data received');
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load movie');
        }
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [id]);

  const ticketCount = adult + child + senior;
  const subtotal = adult * PRICES.adult + child * PRICES.child + senior * PRICES.senior;

  function toggleSeat(r, c) {
    const key = `${r}-${c}`;
    setSelectedSeats(prev => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
      return copy;
    });
  }

  const seatsArray = useMemo(() => {
    const rows = 8;
    const cols = 8;
    const arr = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push({ r, c });
      arr.push(row);
    }
    return arr;
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Book Tickets</h1>

      {loading && <p className={styles.loading}>Loading movie...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}

      {!loading && !error && movie ? (
        <div className={styles.grid}>
          <div className={styles.left}>
            <p className={styles.meta}>{movie?.title || 'Movie'} • {formatTime(selectedTime)}</p>

            <section className={styles.tickets}>
              <h4>Tickets</h4>
              <div className={styles.ticketRow}>
                <label>
                  Adult ($12)
                  <input 
                    type="number" 
                    min={0} 
                    value={adult} 
                    onChange={e => setAdult(Math.max(0, Number(e.target.value || 0)))} 
                  />
                </label>
                <label>
                  Child ($8)
                  <input 
                    type="number" 
                    min={0} 
                    value={child} 
                    onChange={e => setChild(Math.max(0, Number(e.target.value || 0)))} 
                  />
                </label>
                <label>
                  Senior ($10)
                  <input 
                    type="number" 
                    min={0} 
                    value={senior} 
                    onChange={e => setSenior(Math.max(0, Number(e.target.value || 0)))} 
                  />
                </label>
              </div>
            </section>

            <section className={styles.seatsSection}>
              <h4>Select Seats</h4>
              <div className={styles.seatGrid}>
                {seatsArray.map((row, ri) => (
                  <div key={ri} className={styles.seatRow}>
                    {row.map(({ r, c }) => {
                      const key = `${r}-${c}`;
                      const isSelected = selectedSeats.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`${styles.seat} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleSeat(r, c)}
                          aria-pressed={isSelected}
                          aria-label={`Seat row ${r + 1} column ${c + 1}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            <button 
              className={styles.confirmBtn} 
              disabled={ticketCount === 0 || selectedSeats.size === 0}
            >
              See the Details
            </button>
          </div>
        </div>
      ) : !loading && !error ? (
        <p className={styles.noMovie}>No movie found.</p>
      ) : null}
    </div>
  );
}
