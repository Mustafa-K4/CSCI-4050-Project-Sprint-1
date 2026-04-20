'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import LoginModal from '../../../components/auth/LoginModal'
import styles from './page.module.css'

const PRICES = { adult: 12, child: 8, senior: 10 }
const STEP_SELECT = 'select'
const STEP_DETAILS = 'details'
const STEP_CHECKOUT = 'checkout'
const STEP_PAYMENT = 'payment'
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
  const router = useRouter()

  const id = params?.id
  const showingId = searchParams?.get('showingId') || ''

  const [movie, setMovie] = useState(null)
  const [showing, setShowing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(STEP_SELECT)

  const [selectedSeats, setSelectedSeats] = useState({}) // { "0-0": "adult", "0-1": "child", ... }
  const [seatAgeModalOpen, setSeatAgeModalOpen] = useState(false)
  const [pendingSeatKey, setPendingSeatKey] = useState(null)
  const [bookingId, setBookingId] = useState(null)
  const [bookingCreating, setBookingCreating] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [bookedSeats, setBookedSeats] = useState(new Set()) // Seats already booked for this showing
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
  const [loginModalOpen, setLoginModalOpen] = useState(false)

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
    if (!showingId) {
      setShowing(null)
      return
    }

    const ctl = new AbortController()
    fetch(`/api/showings/${showingId}`, { signal: ctl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data && typeof data === 'object') {
          setShowing(data)
        }
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          console.error('Failed to load showing:', requestError)
        }
      })

    return () => ctl.abort()
  }, [showingId])

  useEffect(() => {
    // Fetch existing booked seats for this showing
    if (!showingId) {
      setBookedSeats(new Set())
      return
    }

    const ctl = new AbortController()
    fetch(`/api/tickets?showing=${showingId}`, { signal: ctl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then(tickets => {
        if (Array.isArray(tickets)) {
          const bookedSeatKeys = new Set(tickets.map(t => t.seat))
          setBookedSeats(bookedSeatKeys)
          console.log(`Found ${bookedSeatKeys.size} booked seats for showing ${showingId}`)
        }
      })
      .catch(requestError => {
        if (requestError.name !== 'AbortError') {
          console.error('Failed to load booked seats:', requestError)
        }
      })

    return () => ctl.abort()
  }, [showingId])

  useEffect(() => {
    // Create booking on page load
    async function createInitialBooking() {
      if (!id || !showingId || bookingCreating) return
      
      const userId = getStoredUserId()
      if (!userId) return

      setBookingCreating(true)
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movieId: id,
            showingId,
            userId,
          }),
        })
        const data = await response.json()
        if (response.ok && data?.booking?._id) {
          setBookingId(data.booking._id)
        }
      } catch (err) {
        console.error('Failed to create initial booking:', err)
      } finally {
        setBookingCreating(false)
      }
    }

    createInitialBooking()
  }, [id, showingId])

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

    // Check if we need to restore booking state after login
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('bookingState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          if (state.selectedSeats && Array.isArray(state.selectedSeats)) {
            setSelectedSeats(new Set(state.selectedSeats))
          }
          sessionStorage.removeItem('bookingState')
        } catch (e) {
          console.error('Failed to restore booking state:', e)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const adult = Object.values(selectedSeats).filter(t => t === 'adult').length
  const child = Object.values(selectedSeats).filter(t => t === 'child').length
  const senior = Object.values(selectedSeats).filter(t => t === 'senior').length
  const ticketCount = adult + child + senior
  const subtotal = (adult * PRICES.adult) + (child * PRICES.child) + (senior * PRICES.senior)

  const selectedSeatKeys = useMemo(
    () => Object.keys(selectedSeats).sort(sortSeatKeys),
    [selectedSeats],
  )
  const selectedSeatLabels = useMemo(
    () => selectedSeatKeys.map(key => {
      const label = formatSeatLabel(key)
      const ageType = selectedSeats[key]
      return label ? `${label} (${ageType})` : ''
    }).filter(Boolean),
    [selectedSeatKeys, selectedSeats],
  )

  // Map seat keys to ticket IDs
  const [seatToTicketId, setSeatToTicketId] = useState({}) // { "0-0": "ticketId123", ... }

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
    
    // Don't allow selection of already booked seats
    if (bookedSeats.has(key) && !selectedSeats[key]) {
      return
    }

    if (selectedSeats[key]) {
      // Remove seat and its ticket
      const ticketId = seatToTicketId[key]
      const updatedSeats = { ...selectedSeats }
      delete updatedSeats[key]
      setSelectedSeats(updatedSeats)

      // Remove ticket from booking
      if (bookingId && ticketId) {
        removeTicketFromBooking(ticketId)
      }

      // Clean up seat-ticket mapping
      const newMapping = { ...seatToTicketId }
      delete newMapping[key]
      setSeatToTicketId(newMapping)
    } else {
      // Open age selection modal for new seat
      setPendingSeatKey(key)
      setSeatAgeModalOpen(true)
    }
  }

  function handleSelectAgeForSeat(ageType) {
    if (!pendingSeatKey || !bookingId) return

    // Create ticket first
    const ticketData = {
      booking: bookingId,
      showing: showingId,
      seat: pendingSeatKey,
      ticketType: ageType,
      price: PRICES[ageType] || PRICES.adult,
    }

    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    })
      .then(res => res.json())
      .then(ticketResponse => {
        if (ticketResponse?._id) {
          const ticketId = ticketResponse._id

          // Now add ticket to booking
          return fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketId,
              action: 'add',
            }),
          }).then(res => res.json()).then(bookingResponse => {
            if (bookingResponse.success) {
              // Update local state
              setSelectedSeats(prev => ({
                ...prev,
                [pendingSeatKey]: ageType,
              }))
              setSeatToTicketId(prev => ({
                ...prev,
                [pendingSeatKey]: ticketId,
              }))
              console.log(`Ticket ${ticketId} created and added to booking`)
            } else {
              console.error('Failed to add ticket to booking:', bookingResponse.error)
            }
          })
        } else {
          console.error('Failed to create ticket:', ticketResponse.error)
        }
      })
      .catch(err => console.error('Error creating/adding ticket:', err))
      .finally(() => {
        setSeatAgeModalOpen(false)
        setPendingSeatKey(null)
      })
  }

  function removeTicketFromBooking(ticketId) {
    fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        action: 'remove',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          console.error('Failed to remove ticket from booking:', data.error)
        } else {
          console.log(`Ticket ${ticketId} removed from booking`)
        }
      })
      .catch(err => console.error('Error removing ticket:', err))
  }

  function updateBookingTickets(seatsToUpdate = selectedSeats) {
    // This function is deprecated - now using single ticket operations
    // Kept for reference, but individual seat operations handle it now
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
    if (ticketCount === 0) {
      setCheckoutError('Select at least one seat before continuing.')
      return
    }

    setCheckoutError('')
    setStep(STEP_DETAILS)
  }

  function handleContinueToCheckout() {
    // Check if user is authenticated
    const userId = getStoredUserId()
    if (!userId) {
      // Open login modal instead of redirecting
      setLoginModalOpen(true)
      return
    }

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
      return
    }

    if (step === STEP_PAYMENT) {
      setStep(STEP_CHECKOUT)
    }
  }

  function handleLoginSuccess() {
    // Close modal
    setLoginModalOpen(false)
    // Reload profile data with new user
    setProfileLoading(true)
    
    // Small delay to ensure user is stored in localStorage
    setTimeout(async () => {
      const userId = getStoredUserId()
      if (!userId) {
        setProfileLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()

        if (response.ok && data?.success && data?.user) {
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
          
          // Move to checkout step
          setStep(STEP_CHECKOUT)
        }
      } catch (error) {
        console.error('Failed to reload profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }, 300)
  }

  function validateCheckout() {
    // Name validation
    if (!customerInfo.name || !customerInfo.name.trim()) {
      return '⚠️ Full Name is required'
    }
    if (customerInfo.name.trim().length < 2) {
      return '⚠️ Full Name must be at least 2 characters'
    }

    // Email validation
    if (!customerInfo.email || !customerInfo.email.trim()) {
      return '⚠️ Email address is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email.trim())) {
      return '⚠️ Please enter a valid email address'
    }

    // Payment validation
    if (paymentChoice === 'new') {
      if (!manualCard.cardholderName || !manualCard.cardholderName.trim()) {
        return '⚠️ Cardholder Name is required'
      }
      if (!manualCard.cardNumber || !manualCard.cardNumber.trim()) {
        return '⚠️ Card Number is required'
      }
      if (!manualCard.expirationDate || !manualCard.expirationDate.trim()) {
        return '⚠️ Expiration Date is required'
      }
      if (!manualCard.cvv || !manualCard.cvv.trim()) {
        return '⚠️ CVV is required'
      }
      // Basic card validation
      const cardDigits = manualCard.cardNumber.replace(/\D/g, '')
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        return '⚠️ Card Number must be between 13-19 digits'
      }
    } else if (paymentChoice.startsWith('saved-')) {
      const cardIndex = Number(paymentChoice.replace('saved-', ''))
      if (isNaN(cardIndex) || !savedCards[cardIndex]) {
        return '⚠️ Please select a valid saved payment method'
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
    setStep(STEP_PAYMENT)
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
              {movie?.title || 'Movie'} • {showing?.time ? formatTime(showing.time) : '—'}
            </p>

            <div className={styles.stepRow}>
              <span className={`${styles.stepPill} ${step === STEP_SELECT ? styles.stepActive : ''}`}>1. Seats</span>
              <span className={`${styles.stepPill} ${step === STEP_DETAILS ? styles.stepActive : ''}`}>2. Details</span>
              <span className={`${styles.stepPill} ${step === STEP_CHECKOUT ? styles.stepActive : ''}`}>3. Checkout</span>
              <span className={`${styles.stepPill} ${step === STEP_PAYMENT ? styles.stepActive : ''}`}>4. Payment</span>
              <span className={`${styles.stepPill} ${step === STEP_CONFIRMED ? styles.stepActive : ''}`}>5. Confirmed</span>
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
                      <input type="number" min={0} value={child} readOnly />
                    </label>
                    <label>
                      Senior ($10)
                      <input type="number" min={0} value={senior} readOnly />
                    </label>
                  </div>
                  <p className={styles.ticketHelp}>
                    Click a seat, then choose the ticket type (Adult, Child, Senior) for that seat.
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
                          const ageType = selectedSeats[key]
                          const isSelected = !!ageType
                          const isBooked = bookedSeats.has(key)

                          return (
                            <button
                              key={key}
                              type="button"
                              className={`${styles.seat} ${isSelected ? styles.selected : ''} ${isBooked && !isSelected ? styles.booked : ''}`}
                              onClick={() => toggleSeat(r, c)}
                              disabled={isBooked && !isSelected}
                              aria-pressed={isSelected}
                              aria-label={`Seat ${formatSeatLabel(key)}${isSelected ? ` (${ageType})` : ''}${isBooked && !isSelected ? ' (booked)' : ''}`}
                              title={formatSeatLabel(key)}
                            >
                              {isSelected ? `${formatSeatLabel(key)} (${ageType[0].toUpperCase()})` : formatSeatLabel(key)}
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
                    <span>Adult Tickets ({adult})</span>
                    <span>${(adult * PRICES.adult).toFixed(2)}</span>
                  </div>
                  {child > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Child Tickets ({child})</span>
                      <span>${(child * PRICES.child).toFixed(2)}</span>
                    </div>
                  )}
                  {senior > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Senior Tickets ({senior})</span>
                      <span>${(senior * PRICES.senior).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.summaryRow}>
                    <span>Selected Seats</span>
                    <span>{selectedSeatLabels.length > 0 ? selectedSeatLabels.join(', ') : 'None'}</span>
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
                    <span className={styles.detailValue}>{showing?.time ? formatTime(showing.time) : '—'}</span>
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
                    Full Name <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                    <input
                      className={styles.input}
                      type="text"
                      value={customerInfo.name}
                      onChange={(event) => updateCustomerInfo('name', event.target.value)}
                      placeholder="John Doe"
                      aria-label="Full Name (required)"
                      required
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Email Address <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                    <input
                      className={styles.input}
                      type="email"
                      value={customerInfo.email}
                      onChange={(event) => updateCustomerInfo('email', event.target.value)}
                      placeholder="john@example.com"
                      aria-label="Email Address (required)"
                      required
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
                      aria-label="Address (optional)"
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
                        Cardholder Name <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardholderName}
                          onChange={(event) => updateManualCard('cardholderName', event.target.value)}
                          placeholder="Name on Card"
                          aria-label="Cardholder Name (required)"
                          required
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        Card Number <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardNumber}
                          onChange={(event) => updateManualCard('cardNumber', event.target.value)}
                          placeholder="1234 5678 9012 3456"
                          aria-label="Card Number (required, 13-19 digits)"
                          required
                        />
                      </label>
                      <div className={styles.inlineFields}>
                        <label className={styles.fieldLabel}>
                          Expiration Date <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.expirationDate}
                            onChange={(event) => updateManualCard('expirationDate', event.target.value)}
                            placeholder="MM/YY"
                            aria-label="Expiration Date in MM/YY format (required)"
                            required
                          />
                        </label>
                        <label className={styles.fieldLabel}>
                          CVV <span style={{ color: '#dc2626', fontSize: '1.1em' }}>*</span>
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.cvv}
                            onChange={(event) => updateManualCard('cvv', event.target.value)}
                            placeholder="123"
                            aria-label="CVV (3-4 digits, required)"
                            required
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
                    <span>{showing?.time ? formatTime(showing.time) : '—'}</span>
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

            {step === STEP_PAYMENT ? (
              <section className={styles.stepPanel}>
                <h3 className={styles.sectionTitle}>Payment Processing</h3>
                
                <div className={styles.paymentMockup}>
                  <div className={styles.paymentProcessor}>
                    <div className={styles.processorHeader}>
                      <h4>Secure Payment</h4>
                      <span className={styles.secureIcon}>🔒</span>
                    </div>

                    <div className={styles.processingInfo}>
                      <p className={styles.processingText}>Processing your payment securely...</p>
                      <div className={styles.loadingSpinner}>
                        <div className={styles.spinner}></div>
                      </div>
                    </div>

                    <div className={styles.paymentDetails}>
                      <h5>Payment Details</h5>
                      <div className={styles.detailRow}>
                        <span>Cardholder:</span>
                        <span>{customerInfo.name}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Card Type:</span>
                        <span>Visa •••• {manualCard.cardNumber.slice(-4) || (paymentChoice.startsWith('saved-') ? '****' : 'N/A')}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Amount:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className={styles.securityNote}>
                      <p>Your payment information is secure. This is a mockup demonstration of the payment processing page.</p>
                    </div>
                  </div>

                  <section className={styles.summaryPanel}>
                    <h4>Order Summary</h4>
                    <div className={styles.summaryRow}>
                      <span>Movie</span>
                      <span>{movie?.title || 'Movie'}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Showtime</span>
                      <span>{showing?.time ? formatTime(showing.time) : '—'}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Seats</span>
                      <span>{selectedSeatLabels.join(', ')}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Total Amount</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  </section>
                </div>

                <div className={styles.paymentNote}>
                  <p><strong>Note:</strong> This is a mockup demonstration. In the final implementation, this page will integrate with a real payment processor (Stripe, PayPal, etc.). The payment processing and order confirmation will be completed in the final demo.</p>
                </div>

                <div className={styles.actionRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
                    Back to Checkout
                  </button>
                  <button 
                    type="button" 
                    className={styles.confirmBtn} 
                    onClick={() => {
                      setConfirmationCode(`BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
                      setStep(STEP_CONFIRMED)
                    }}
                  >
                    Complete Payment (Demo)
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
                    <span>{showing?.time ? formatTime(showing.time) : '—'}</span>
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

      {/* Age Selection Modal */}
      {seatAgeModalOpen && (
        <div className={styles.modal} onClick={() => setSeatAgeModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Select Ticket Type</h3>
            <p className={styles.modalSubtitle}>for {formatSeatLabel(pendingSeatKey)}</p>
            <div className={styles.ageOptions}>
              <button
                className={styles.ageButton}
                onClick={() => handleSelectAgeForSeat('adult')}
              >
                <span className={styles.ageLabel}>Adult</span>
                <span className={styles.agePrice}>${PRICES.adult}</span>
              </button>
              <button
                className={styles.ageButton}
                onClick={() => handleSelectAgeForSeat('child')}
              >
                <span className={styles.ageLabel}>Child</span>
                <span className={styles.agePrice}>${PRICES.child}</span>
              </button>
              <button
                className={styles.ageButton}
                onClick={() => handleSelectAgeForSeat('senior')}
              >
                <span className={styles.ageLabel}>Senior</span>
                <span className={styles.agePrice}>${PRICES.senior}</span>
              </button>
            </div>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setSeatAgeModalOpen(false)
                setPendingSeatKey(null)
                // Remove the pending seat if it was added
                setSelectedSeats((prev) => {
                  const copy = { ...prev }
                  if (copy[pendingSeatKey]) {
                    delete copy[pendingSeatKey]
                  }
                  return copy
                })
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
