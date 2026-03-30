'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

const PRICES = { adult: 12, child: 8, senior: 10 }
const STEP_SELECT = 'select'
const STEP_DETAILS = 'details'
const STEP_CHECKOUT = 'checkout'
const STEP_CONFIRMED = 'confirmed'

function formatTime(t) {
  if (!t) return '—'
  const [hh, mm] = t.split(':').map((n) => Number(n))
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const hour = ((hh + 11) % 12) + 1
  return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`
}

function getStoredUserId() {
  if (typeof window === 'undefined') return ''

  try {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) return ''
    const parsedUser = JSON.parse(storedUser)
    return parsedUser?.id || parsedUser?._id || parsedUser?.userId || ''
  } catch {
    return ''
  }
}

function formatSeatLabel(key) {
  const [rowValue, colValue] = String(key || '').split('-').map((value) => Number(value))
  if (Number.isNaN(rowValue) || Number.isNaN(colValue)) return ''
  return `${String.fromCharCode(65 + rowValue)}${colValue + 1}`
}

function sortSeatKeys(a, b) {
  const [rowA, colA] = String(a).split('-').map((value) => Number(value))
  const [rowB, colB] = String(b).split('-').map((value) => Number(value))

  if (rowA !== rowB) return rowA - rowB
  return colA - colB
}

function formatCardNumber(cardNumber) {
  const digits = String(cardNumber || '').replace(/\D/g, '')

  if (!digits) return 'Saved card'
  if (digits.length <= 4) return digits

  return `•••• •••• •••• ${digits.slice(-4)}`
}

function createEmptyCard() {
  return {
    cardholderName: '',
    cardNumber: '',
    expirationDate: '',
    cvv: '',
  }
}

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const id = params?.id
  const selectedTime = searchParams?.get('time') || ''

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(STEP_SELECT)

  const [selectedSeats, setSelectedSeats] = useState(new Set())
  const [profileLoading, setProfileLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: '',
  })
  const [savedCards, setSavedCards] = useState([])
  const [paymentChoice, setPaymentChoice] = useState('new')
  const [manualCard, setManualCard] = useState(createEmptyCard())
  const [checkoutError, setCheckoutError] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided')
      setLoading(false)
      return
    }

    const ctl = new AbortController()
    setLoading(true)
    setError(null)

    fetch(`/api/movies/${id}`, { signal: ctl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data && typeof data === 'object') {
          setMovie(data)
        } else {
          setError('Invalid movie data received')
        }
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Failed to load movie')
        }
      })
      .finally(() => setLoading(false))

    return () => ctl.abort()
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      const userId = getStoredUserId()
      if (!userId) {
        if (!cancelled) setProfileLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()

        if (!response.ok || !data?.success || !data?.user || cancelled) {
          return
        }

        const fetchedUser = data.user
        const cards = Array.isArray(fetchedUser.paymentCards)
          ? fetchedUser.paymentCards.slice(0, 3)
          : Array.isArray(fetchedUser.payments)
            ? fetchedUser.payments.slice(0, 3)
            : []

        setCustomerInfo({
          name: String(fetchedUser.name || ''),
          email: String(fetchedUser.email || ''),
          address: Array.isArray(fetchedUser.address)
            ? String(fetchedUser.address[0] || '')
            : String(fetchedUser.address || ''),
        })
        setSavedCards(cards)
        setPaymentChoice(cards.length > 0 ? 'saved-0' : 'new')
      } catch {
        // Leave checkout available with manual entry.
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const adult = selectedSeats.size
  const ticketCount = adult
  const subtotal = adult * PRICES.adult

  const selectedSeatKeys = useMemo(
    () => Array.from(selectedSeats).sort(sortSeatKeys),
    [selectedSeats],
  )
  const selectedSeatLabels = useMemo(
    () => selectedSeatKeys.map(formatSeatLabel).filter(Boolean),
    [selectedSeatKeys],
  )

  const seatsArray = useMemo(() => {
    const rows = 8
    const cols = 8
    const arr = []

    for (let r = 0; r < rows; r += 1) {
      const row = []
      for (let c = 0; c < cols; c += 1) row.push({ r, c })
      arr.push(row)
    }

    return arr
  }, [])

  function toggleSeat(r, c) {
    if (step !== STEP_SELECT) return

    const key = `${r}-${c}`
    setSelectedSeats((prev) => {
      const copy = new Set(prev)
      if (copy.has(key)) copy.delete(key)
      else copy.add(key)
      return copy
    })
  }

  function updateCustomerInfo(field, value) {
    setCheckoutError('')
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function updateManualCard(field, value) {
    setCheckoutError('')
    setManualCard((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleContinueToDetails() {
    if (selectedSeats.size === 0) {
      setCheckoutError('Select at least one seat before continuing.')
      return
    }

    setCheckoutError('')
    setStep(STEP_DETAILS)
  }

  function handleContinueToCheckout() {
    setCheckoutError('')
    setStep(STEP_CHECKOUT)
  }

  function handleBack() {
    setCheckoutError('')

    if (step === STEP_DETAILS) {
      setStep(STEP_SELECT)
      return
    }

    if (step === STEP_CHECKOUT) {
      setStep(STEP_DETAILS)
    }
  }

  function validateCheckout() {
    if (!customerInfo.name.trim()) {
      return 'Name is required for checkout.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim())) {
      return 'Enter a valid email address for checkout.'
    }

    if (paymentChoice === 'new') {
      if (!manualCard.cardholderName.trim()) {
        return 'Cardholder name is required.'
      }

      if (!manualCard.cardNumber.trim() || !manualCard.expirationDate.trim() || !manualCard.cvv.trim()) {
        return 'Complete all payment card fields before checking out.'
      }
    }

    if (paymentChoice.startsWith('saved-')) {
      const cardIndex = Number(paymentChoice.replace('saved-', ''))
      if (!savedCards[cardIndex]) {
        return 'Select a valid saved payment card.'
      }
    }

    return ''
  }

  function handleCompleteCheckout() {
    const validationError = validateCheckout()
    if (validationError) {
      setCheckoutError(validationError)
      return
    }

    setCheckoutError('')
    setConfirmationCode(`BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
    setStep(STEP_CONFIRMED)
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Link href={`/movies/${id || ''}`} className={styles.backLink}>
          ← Back to Movie
        </Link>
        <h1 className={styles.pageTitle}>Book Tickets</h1>
      </div>

      {loading && <p className={styles.loading}>Loading movie...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}

      {!loading && !error && movie ? (
        <div className={styles.grid}>
          <div className={styles.left}>
            <p className={styles.meta}>
              {movie?.title || 'Movie'} • {formatTime(selectedTime)}
            </p>

            <div className={styles.stepRow}>
              <span className={`${styles.stepPill} ${step === STEP_SELECT ? styles.stepActive : ''}`}>1. Seats</span>
              <span className={`${styles.stepPill} ${step === STEP_DETAILS ? styles.stepActive : ''}`}>2. Details</span>
              <span className={`${styles.stepPill} ${step === STEP_CHECKOUT ? styles.stepActive : ''}`}>3. Checkout</span>
              <span className={`${styles.stepPill} ${step === STEP_CONFIRMED ? styles.stepActive : ''}`}>4. Confirmed</span>
            </div>

            {checkoutError ? <p className={styles.error}>{checkoutError}</p> : null}

            {step === STEP_SELECT ? (
              <>
                <section className={styles.tickets}>
                  <h4>Tickets</h4>
                  <div className={styles.ticketRow}>
                    <label>
                      Adult ($12)
                      <input type="number" min={0} value={adult} readOnly />
                    </label>
                    <label>
                      Child ($8)
                      <input type="number" min={0} value={0} readOnly />
                    </label>
                    <label>
                      Senior ($10)
                      <input type="number" min={0} value={0} readOnly />
                    </label>
                  </div>
                  <p className={styles.ticketHelp}>
                    Each selected seat is automatically added as 1 adult ticket.
                  </p>
                </section>

                <section className={styles.seatsSection}>
                  <h4>Select Seats</h4>
                  <div className={styles.screen}>SCREEN</div>
                  <div className={styles.seatGrid}>
                    {seatsArray.map((row, rowIndex) => (
                      <div key={rowIndex} className={styles.seatRow}>
                        {row.map(({ r, c }) => {
                          const key = `${r}-${c}`
                          const isSelected = selectedSeats.has(key)

                          return (
                            <button
                              key={key}
                              type="button"
                              className={`${styles.seat} ${isSelected ? styles.selected : ''}`}
                              onClick={() => toggleSeat(r, c)}
                              aria-pressed={isSelected}
                              aria-label={`Seat ${formatSeatLabel(key)}`}
                              title={formatSeatLabel(key)}
                            >
                              {formatSeatLabel(key)}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.summaryPanel}>
                  <h4>Order Summary</h4>
                  <div className={styles.summaryRow}>
                    <span>Adult Tickets</span>
                    <span>{adult}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Selected Seats</span>
                    <span>{selectedSeatLabels.length > 0 ? selectedSeatLabels.join(', ') : 'None'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Price Per Ticket</span>
                    <span>${PRICES.adult.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </section>

                <button
                  className={styles.confirmBtn}
                  disabled={ticketCount === 0}
                  onClick={handleContinueToDetails}
                >
                  See the Details
                </button>
              </>
            ) : null}

            {step === STEP_DETAILS ? (
              <section className={styles.stepPanel}>
                <h3 className={styles.sectionTitle}>Booking Details</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Movie</span>
                    <span className={styles.detailValue}>{movie?.title || 'Movie'}</span>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Showtime</span>
                    <span className={styles.detailValue}>{formatTime(selectedTime)}</span>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Seats</span>
                    <span className={styles.detailValue}>{selectedSeatLabels.join(', ')}</span>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Tickets</span>
                    <span className={styles.detailValue}>{ticketCount} adult</span>
                  </div>
                </div>

                <section className={styles.summaryPanel}>
                  <h4>Price Details</h4>
                  <div className={styles.summaryRow}>
                    <span>{ticketCount} x Adult Tickets</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </section>

                <div className={styles.actionRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
                    Back to Seats
                  </button>
                  <button type="button" className={styles.confirmBtn} onClick={handleContinueToCheckout}>
                    Continue to Checkout
                  </button>
                </div>
              </section>
            ) : null}

            {step === STEP_CHECKOUT ? (
              <section className={styles.stepPanel}>
                <h3 className={styles.sectionTitle}>Checkout</h3>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Name
                    <input
                      className={styles.input}
                      type="text"
                      value={customerInfo.name}
                      onChange={(event) => updateCustomerInfo('name', event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Email
                    <input
                      className={styles.input}
                      type="email"
                      value={customerInfo.email}
                      onChange={(event) => updateCustomerInfo('email', event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Address
                    <input
                      className={styles.input}
                      type="text"
                      value={customerInfo.address}
                      onChange={(event) => updateCustomerInfo('address', event.target.value)}
                      placeholder="Street, City, State"
                    />
                  </label>
                </div>

                <section className={styles.checkoutCard}>
                  <div className={styles.checkoutHeader}>
                    <h4>Payment Method</h4>
                    {profileLoading ? <span className={styles.helperText}>Loading saved cards...</span> : null}
                  </div>

                  {savedCards.length > 0 ? (
                    <div className={styles.savedCardList}>
                      {savedCards.map((card, index) => (
                        <label key={`saved-card-${index}`} className={styles.savedCardOption}>
                          <input
                            type="radio"
                            name="paymentChoice"
                            value={`saved-${index}`}
                            checked={paymentChoice === `saved-${index}`}
                            onChange={(event) => setPaymentChoice(event.target.value)}
                          />
                          <span>
                            {formatCardNumber(card.cardNumber)} • Expires {card.expirationDate || 'N/A'}
                          </span>
                        </label>
                      ))}

                      <label className={styles.savedCardOption}>
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="new"
                          checked={paymentChoice === 'new'}
                          onChange={(event) => setPaymentChoice(event.target.value)}
                        />
                        <span>Use a different card for this checkout</span>
                      </label>
                    </div>
                  ) : (
                    <p className={styles.helperText}>
                      No saved cards found. Enter a card below or add one from your profile later.
                    </p>
                  )}

                  {paymentChoice === 'new' ? (
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        Cardholder Name
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardholderName}
                          onChange={(event) => updateManualCard('cardholderName', event.target.value)}
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        Card Number
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardNumber}
                          onChange={(event) => updateManualCard('cardNumber', event.target.value)}
                          placeholder="1234 5678 9012 3456"
                        />
                      </label>
                      <div className={styles.inlineFields}>
                        <label className={styles.fieldLabel}>
                          Expiration Date
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.expirationDate}
                            onChange={(event) => updateManualCard('expirationDate', event.target.value)}
                            placeholder="MM/YY"
                          />
                        </label>
                        <label className={styles.fieldLabel}>
                          CVV
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.cvv}
                            onChange={(event) => updateManualCard('cvv', event.target.value)}
                            placeholder="123"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className={styles.summaryPanel}>
                  <h4>Final Order Summary</h4>
                  <div className={styles.summaryRow}>
                    <span>Movie</span>
                    <span>{movie?.title || 'Movie'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Showtime</span>
                    <span>{formatTime(selectedTime)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Seats</span>
                    <span>{selectedSeatLabels.join(', ')}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </section>

                <div className={styles.actionRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
                    Back to Details
                  </button>
                  <button type="button" className={styles.confirmBtn} onClick={handleCompleteCheckout}>
                    Complete Checkout
                  </button>
                </div>
              </section>
            ) : null}

            {step === STEP_CONFIRMED ? (
              <section className={styles.confirmationPanel}>
                <p className={styles.confirmationEyebrow}>Booking Confirmed</p>
                <h3 className={styles.sectionTitle}>Your tickets are ready</h3>
                <p className={styles.confirmationText}>
                  Confirmation code: <strong>{confirmationCode}</strong>
                </p>

                <section className={styles.summaryPanel}>
                  <h4>Confirmation Summary</h4>
                  <div className={styles.summaryRow}>
                    <span>Movie</span>
                    <span>{movie?.title || 'Movie'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Showtime</span>
                    <span>{formatTime(selectedTime)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Seats</span>
                    <span>{selectedSeatLabels.join(', ')}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Email</span>
                    <span>{customerInfo.email || 'N/A'}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total Paid</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </section>

                <div className={styles.actionRow}>
                  <Link href="/" className={styles.linkButton}>
                    Return Home
                  </Link>
                  <Link href="/profile" className={styles.secondaryLinkButton}>
                    View Profile
                  </Link>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : !loading && !error ? (
        <p className={styles.noMovie}>No movie found.</p>
      ) : null}
    </div>
  )
}
