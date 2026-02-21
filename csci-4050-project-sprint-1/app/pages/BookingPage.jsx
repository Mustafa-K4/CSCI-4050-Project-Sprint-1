import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styles from './BookingPage.module.css';

const PRICES = { adult: 12, child: 8, senior: 10 };

function formatTime(t) {
  if (!t) return '-';
  const [hh, mm] = t.split(':').map(n => Number(n));
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour = ((hh + 11) % 12) + 1;
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export default function BookingPage() {
  const { id } = useParams();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const selectedTime = params.get('time') || '';

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const [senior, setSenior] = useState(0);

  // Seats: represent as a Set of seat keys like 'r-c'
  const [selectedSeats, setSelectedSeats] = useState(new Set());

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/movies/${id}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => setMovie(data))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load movie');
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
      <header className={styles.header}>
        <h2>Booking</h2>
        <p className={styles.subtitle}>Movie #{id}</p>
      </header>

      {loading && <p>Loading movie...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}

      {!loading && !error && movie && (
        <div className={styles.grid}>
          <div className={styles.left}>
            <h3 className={styles.title}>{movie.title}</h3>
            <p className={styles.meta}>Showtime: <strong>{formatTime(selectedTime)}</strong></p>

            <section className={styles.tickets}>
              <h4>Tickets</h4>
              <div className={styles.ticketRow}>
                <label>Adult (${PRICES.adult})
                  <input type="number" min={0} value={adult} onChange={e => setAdult(Math.max(0, Number(e.target.value || 0)))} />
                </label>
                <label>Child (${PRICES.child})
                  <input type="number" min={0} value={child} onChange={e => setChild(Math.max(0, Number(e.target.value || 0)))} />
                </label>
                <label>Senior (${PRICES.senior})
                  <input type="number" min={0} value={senior} onChange={e => setSenior(Math.max(0, Number(e.target.value || 0)))} />
                </label>
              </div>

              <div className={styles.summary}>
                <div>Tickets: <strong>{ticketCount}</strong></div>
                <div>Total: <strong>${subtotal.toFixed(2)}</strong></div>
              </div>
            </section>

            <section className={styles.seatsSection}>
              <h4>Select Seats</h4>
              <div className={styles.screen}>SCREEN</div>
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
                          aria-label={`Seat ${r + 1}-${c + 1}`}
                        >{r + 1}-{c + 1}</button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={styles.selectionSummary}>
                <div>Selected seats: <strong>{selectedSeats.size}</strong></div>
              </div>
            </section>
          </div>

          <aside className={styles.right}>
            <div className={styles.card}>
              <h4>Order Summary</h4>
              <p><strong>{movie.title}</strong></p>
              <p>Showtime: {formatTime(selectedTime)}</p>
              <p>Tickets: {ticketCount}</p>
              <p>Seats selected: {selectedSeats.size}</p>
              <hr />
              <div className={styles.totalRow}>Total: <span className={styles.total}>${subtotal.toFixed(2)}</span></div>
              <button className={styles.confirmBtn} disabled={ticketCount === 0}>Proceed to Payment</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
