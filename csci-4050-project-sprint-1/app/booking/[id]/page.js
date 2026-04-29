'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import LoginModal from '../../../components/auth/LoginModal'
import { TICKET_PRICES as PRICES } from '../../../lib/booking/ticketFactory'
import {
  normalizeCardNumberInput,
  normalizeCvvInput,
  normalizeExpirationInput,
  validatePaymentCard,
} from '../../../lib/security/payment-card'
import styles from './page.module.css'

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

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShowtimeValue(showing) {
  const datePart = formatDate(showing?.date)
  const timePart = showing?.time ? formatTime(showing.time) : ''
  return [datePart, timePart].filter(Boolean).join(' • ') || '—'
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

function createEmptyTicketRequest() {
  return {
    adult: 0,
    child: 0,
    senior: 0,
  }
}

function normalizeTicketCounts(ticketCounts, selectedSeatCount) {
  const seatCount = Math.max(Number(selectedSeatCount) || 0, 0)
  const child = Math.min(Math.max(Math.floor(Number(ticketCounts.child) || 0), 0), seatCount)
  const senior = Math.min(Math.max(Math.floor(Number(ticketCounts.senior) || 0), 0), Math.max(seatCount - child, 0))
  const adult = Math.max(seatCount - child - senior, 0)

  return { adult, child, senior }
}

function assignTicketTypesToSeats(seats, ticketCounts) {
  const nextSeats = {}
  const sortedSeatKeys = Object.keys(seats).sort(sortSeatKeys)

  sortedSeatKeys.forEach((key, index) => {
    if (index < ticketCounts.adult) {
      nextSeats[key] = 'adult'
    } else if (index < ticketCounts.adult + ticketCounts.child) {
      nextSeats[key] = 'child'
    } else {
      nextSeats[key] = 'senior'
    }
  })

  return nextSeats
}

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id
  const showingId = searchParams?.get('showingId') || ''

  const [movie, setMovie] = useState(null)
  const [showing, setShowing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(STEP_SELECT)

  const [selectedSeats, setSelectedSeats] = useState({}) // { "0-0": "adult", "0-1": "child", ... }
  const [requestedTickets, setRequestedTickets] = useState(createEmptyTicketRequest())
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
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  async function loadUserProfile(userId) {
    if (!userId) {
      setProfileLoading(false)
      return false
    }

    setProfileLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (!response.ok || !data?.success || !data?.user) {
        return false
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
      return true
    } catch {
      return false
    } finally {
      setProfileLoading(false)
    }
  }

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
    let cancelled = false

    async function loadProfile() {
      const userId = getStoredUserId()
      if (!userId) {
        if (!cancelled) setProfileLoading(false)
        return
      }
      const loaded = await loadUserProfile(userId)
      if (!loaded && !cancelled) {
        setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedAdult = Object.values(selectedSeats).filter(t => t === 'adult').length
  const selectedChild = Object.values(selectedSeats).filter(t => t === 'child').length
  const selectedSenior = Object.values(selectedSeats).filter(t => t === 'senior').length
  const selectedTicketCount = selectedAdult + selectedChild + selectedSenior
  const requestedTicketCount =
    requestedTickets.adult + requestedTickets.child + requestedTickets.senior
  const selectedSavedCard = paymentChoice.startsWith('saved-')
    ? savedCards[Number(paymentChoice.replace('saved-', ''))]
    : null
  const paymentLastFour = paymentChoice === 'new'
    ? manualCard.cardNumber.replace(/\D/g, '').slice(-4)
    : String(selectedSavedCard?.cardNumber || '').replace(/\D/g, '').slice(-4)
  const subtotal =
    (requestedTickets.adult * PRICES.adult) +
    (requestedTickets.child * PRICES.child) +
    (requestedTickets.senior * PRICES.senior)
  const selectionComplete =
    requestedTickets.adult === selectedAdult &&
    requestedTickets.child === selectedChild &&
    requestedTickets.senior === selectedSenior

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

  const seatLayout = useMemo(() => {
    const seatCount = Number(showing?.showroomID?.seatcount || 40)
    const cols = seatCount <= 40 ? 8 : seatCount <= 60 ? 10 : 12
    const rows = Math.ceil(seatCount / cols)
    return { rows, cols, seatCount }
  }, [showing])

  const seatsArray = useMemo(() => {
    const arr = []
    let seatIndex = 0

    for (let r = 0; r < seatLayout.rows; r += 1) {
      const row = []
      for (let c = 0; c < seatLayout.cols; c += 1) {
        if (seatIndex >= seatLayout.seatCount) break
        row.push({ r, c })
        seatIndex += 1
      }
      arr.push(row)
    }

    return arr
  }, [seatLayout])

  function toggleSeat(r, c) {
    if (step !== STEP_SELECT) return

    const key = `${r}-${c}`

    // Don't allow selection of already booked seats
    if (bookedSeats.has(key) && !selectedSeats[key]) {
      return
    }

    if (selectedSeats[key]) {
      const removedType = selectedSeats[key]
      const updatedSeats = { ...selectedSeats }
      delete updatedSeats[key]
      setSelectedSeats(updatedSeats)
      setCheckoutError('')

      setRequestedTickets((currentTickets) => normalizeTicketCounts({
        ...currentTickets,
        [removedType]: Math.max((currentTickets[removedType] || 0) - 1, 0),
      }, Object.keys(updatedSeats).length))
      return
    }

    setSelectedSeats({
      ...selectedSeats,
      [key]: 'adult',
    })
    setRequestedTickets((currentTickets) => ({
      ...currentTickets,
      adult: currentTickets.adult + 1,
    }))
    setCheckoutError('')
  }

  function updateRequestedTickets(type, value) {
    if (type === 'adult') return

    const parsedValue = Number(value)
    const nextValue = Number.isFinite(parsedValue) && parsedValue >= 0 ? Math.floor(parsedValue) : 0
    const nextTickets = normalizeTicketCounts({
      ...requestedTickets,
      [type]: nextValue,
    }, selectedTicketCount)

    setRequestedTickets(nextTickets)
    setSelectedSeats(assignTicketTypesToSeats(selectedSeats, nextTickets))
    setCheckoutError('')
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
    const nextValue = field === 'cardNumber'
      ? normalizeCardNumberInput(value)
      : field === 'expirationDate'
        ? normalizeExpirationInput(value)
        : field === 'cvv'
          ? normalizeCvvInput(value)
          : value

    setManualCard((prev) => ({
      ...prev,
      [field]: nextValue,
    }))
  }

  function handleContinueToDetails() {
    if (selectedTicketCount === 0) {
      setCheckoutError('Select at least one seat before continuing.')
      return
    }

    if (!selectionComplete || selectedTicketCount !== requestedTicketCount) {
      setCheckoutError('Ticket age groups must match the number of selected seats.')
      return
    }

    setCheckoutError('')
    setStep(STEP_DETAILS)
  }

  function handleContinueToCheckout() {
    const userId = getStoredUserId()
    if (!userId) {
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

  async function handleLoginSuccess() {
    setLoginModalOpen(false)
    const userId = getStoredUserId()
    const loaded = await loadUserProfile(userId)
    if (loaded) {
      setStep(STEP_CHECKOUT)
    }
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
      const cardError = validatePaymentCard(manualCard, { requireCardholderName: true })
      if (cardError) return `⚠️ ${cardError}`
    } else if (paymentChoice.startsWith('saved-')) {
      const cardIndex = Number(paymentChoice.replace('saved-', ''))
      if (isNaN(cardIndex) || !savedCards[cardIndex]) {
        return '⚠️ Please select a valid saved payment method'
      }
    }

    return ''
  }

  function handleCompleteCheckout() {
    if (!selectionComplete || selectedTicketCount !== requestedTicketCount) {
      setCheckoutError('Selected seats must still match the requested ticket counts.')
      setStep(STEP_SELECT)
      return
    }

    const validationError = validateCheckout()
    if (validationError) {
      setCheckoutError(validationError)
      return
    }

    setCheckoutError('')
    setStep(STEP_PAYMENT)
  }

  const ticketSummaryText = [
    requestedTickets.adult > 0 ? `${requestedTickets.adult} adult` : '',
    requestedTickets.child > 0 ? `${requestedTickets.child} child` : '',
    requestedTickets.senior > 0 ? `${requestedTickets.senior} senior` : '',
  ]
    .filter(Boolean)
    .join(', ')

  async function handleFinalizeBooking() {
    const userId = getStoredUserId()
    if (!userId) {
      setLoginModalOpen(true)
      return
    }

    setCheckoutError('')
    setPaymentSubmitting(true)

    try {
      if (!selectionComplete || selectedTicketCount !== requestedTicketCount) {
        throw new Error('Selected seats must match the requested ticket counts before payment.')
      }

      const paymentMethod = paymentChoice === 'new' ? 'card' : 'saved-card'

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: id,
          showingId,
          userId,
          showtime: formatShowtimeValue(showing),
          seats: selectedSeatKeys,
          seatSelections: selectedSeats,
          ticketTypes: requestedTickets,
          customerInfo,
          paymentMethod,
        }),
      })

      const bookingData = await bookingResponse.json()
      if (!bookingResponse.ok || !bookingData?.booking?._id) {
        const details = Array.isArray(bookingData?.details) ? ` ${bookingData.details.join(' ')}` : ''
        throw new Error(bookingData?.error ? `${bookingData.error}${details}` : 'Failed to create booking.')
      }

      const confirmResponse = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.booking._id,
          userId,
          paymentMethod,
        }),
      })

      const confirmData = await confirmResponse.json()
      if (!confirmResponse.ok) {
        if (confirmResponse.status === 409 && Array.isArray(confirmData?.conflictingSeats)) {
          setBookedSeats((prev) => new Set([...prev, ...confirmData.conflictingSeats]))
          setSelectedSeats((prev) => {
            const next = { ...prev }
            const nextTickets = { ...requestedTickets }

            confirmData.conflictingSeats.forEach((seat) => {
              const seatType = next[seat]
              if (seatType) {
                nextTickets[seatType] = Math.max((nextTickets[seatType] || 0) - 1, 0)
              }
              delete next[seat]
            })
            setRequestedTickets(normalizeTicketCounts(nextTickets, Object.keys(next).length))
            return next
          })
          setStep(STEP_SELECT)
        }

        throw new Error(confirmData?.error || 'Failed to confirm booking.')
      }

      setConfirmationCode(confirmData?.booking?.confirmationCode || bookingData.booking.confirmationCode)
      setBookedSeats((prev) => new Set([...prev, ...selectedSeatKeys]))
      setStep(STEP_CONFIRMED)
    } catch (submissionError) {
      setCheckoutError(submissionError.message || 'Unable to complete booking.')
    } finally {
      setPaymentSubmitting(false)
    }
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
              {movie?.title || 'Movie'} • {formatShowtimeValue(showing)}
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
                      <input
                        type="number"
                        min={0}
                        value={requestedTickets.adult}
                        readOnly
                        aria-readonly="true"
                      />
                    </label>
                    <label>
                      Child ($8)
                      <input
                        type="number"
                        min={0}
                        max={Math.max(selectedTicketCount - requestedTickets.senior, 0)}
                        value={requestedTickets.child}
                        disabled={selectedTicketCount === 0}
                        onChange={(event) => updateRequestedTickets('child', event.target.value)}
                      />
                    </label>
                    <label>
                      Senior ($10)
                      <input
                        type="number"
                        min={0}
                        max={Math.max(selectedTicketCount - requestedTickets.child, 0)}
                        value={requestedTickets.senior}
                        disabled={selectedTicketCount === 0}
                        onChange={(event) => updateRequestedTickets('senior', event.target.value)}
                      />
                    </label>
                  </div>
                  <p className={styles.ticketHelp}>
                    Select seats first. Each selected seat starts as an adult ticket; adjust child or senior
                    counts here if needed.
                  </p>
                  <p className={styles.selectionStatus}>
                    Selected {selectedTicketCount} seat{selectedTicketCount === 1 ? '' : 's'} • Ticket total {requestedTicketCount}
                  </p>
                </section>

                <section className={styles.seatsSection}>
                  <h4>Select Seats</h4>
                  <p className={styles.helperText}>
                    {showing?.showroomID?.cinema || 'Selected showroom'} • {seatLayout.seatCount} seats
                  </p>
                  <div className={styles.screen}>SCREEN</div>
                  <div className={styles.legendRow}>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendAvailable}`}></span>
                      Available
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendSelected}`}></span>
                      Selected
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendBooked}`}></span>
                      Booked
                    </span>
                  </div>
                  <div className={styles.seatGrid}>
                    {seatsArray.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className={styles.seatRow}
                        style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                      >
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
                    <span>Adult Tickets ({requestedTickets.adult})</span>
                    <span>${(requestedTickets.adult * PRICES.adult).toFixed(2)}</span>
                  </div>
                  {requestedTickets.child > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Child Tickets ({requestedTickets.child})</span>
                      <span>${(requestedTickets.child * PRICES.child).toFixed(2)}</span>
                    </div>
                  )}
                  {requestedTickets.senior > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Senior Tickets ({requestedTickets.senior})</span>
                      <span>${(requestedTickets.senior * PRICES.senior).toFixed(2)}</span>
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
                  disabled={selectedTicketCount === 0}
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
                    <span className={styles.detailValue}>{formatShowtimeValue(showing)}</span>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Seats</span>
                    <span className={styles.detailValue}>{selectedSeatLabels.join(', ')}</span>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Tickets</span>
                    <span className={styles.detailValue}>{ticketSummaryText || '—'}</span>
                  </div>
                </div>

                <section className={styles.summaryPanel}>
                  <h4>Price Details</h4>
                  {requestedTickets.adult > 0 ? (
                    <div className={styles.summaryRow}>
                      <span>{requestedTickets.adult} x Adult Tickets</span>
                      <span>${(requestedTickets.adult * PRICES.adult).toFixed(2)}</span>
                    </div>
                  ) : null}
                  {requestedTickets.child > 0 ? (
                    <div className={styles.summaryRow}>
                      <span>{requestedTickets.child} x Child Tickets</span>
                      <span>${(requestedTickets.child * PRICES.child).toFixed(2)}</span>
                    </div>
                  ) : null}
                  {requestedTickets.senior > 0 ? (
                    <div className={styles.summaryRow}>
                      <span>{requestedTickets.senior} x Senior Tickets</span>
                      <span>${(requestedTickets.senior * PRICES.senior).toFixed(2)}</span>
                    </div>
                  ) : null}
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
                    Full Name <span className={styles.required}>*</span>
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
                    Email Address <span className={styles.required}>*</span>
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
                        Cardholder Name <span className={styles.required}>*</span>
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardholderName}
                          onChange={(event) => updateManualCard('cardholderName', event.target.value)}
                          placeholder="Name on Card"
                          aria-label="Cardholder Name (required)"
                          maxLength={80}
                          required
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        Card Number <span className={styles.required}>*</span>
                        <input
                          className={styles.input}
                          type="text"
                          value={manualCard.cardNumber}
                          onChange={(event) => updateManualCard('cardNumber', event.target.value)}
                          placeholder="1234 5678 9012 3456"
                          aria-label="Card Number (required, exactly 16 digits)"
                          inputMode="numeric"
                          maxLength={19}
                          required
                        />
                      </label>
                      <div className={styles.inlineFields}>
                        <label className={styles.fieldLabel}>
                          Expiration Date <span className={styles.required}>*</span>
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.expirationDate}
                            onChange={(event) => updateManualCard('expirationDate', event.target.value)}
                            placeholder="MM/YY"
                            aria-label="Expiration Date in MM/YY format (required)"
                            inputMode="numeric"
                            maxLength={5}
                            required
                          />
                        </label>
                        <label className={styles.fieldLabel}>
                          CVV <span className={styles.required}>*</span>
                          <input
                            className={styles.input}
                            type="text"
                            value={manualCard.cvv}
                            onChange={(event) => updateManualCard('cvv', event.target.value)}
                            placeholder="123"
                            aria-label="CVV (3-4 digits, required)"
                            inputMode="numeric"
                            maxLength={4}
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
                    <span>{formatShowtimeValue(showing)}</span>
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
                
                <div className={styles.paymentLayout}>
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
                        <span>Visa •••• {paymentLastFour || 'N/A'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Amount:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className={styles.securityNote}>
                      <p>Your payment information is secure. Review the payment details before completing the booking.</p>
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
                      <span>{formatShowtimeValue(showing)}</span>
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
                  <p><strong>Note:</strong> Submitting this step completes the booking and sends the confirmation email.</p>
                </div>

                <div className={styles.actionRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
                    Back to Checkout
                  </button>
                  <button 
                    type="button" 
                    className={styles.confirmBtn} 
                    onClick={handleFinalizeBooking}
                    disabled={paymentSubmitting}
                  >
                    {paymentSubmitting ? 'Processing...' : 'Complete Payment'}
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
                    <span>{formatShowtimeValue(showing)}</span>
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

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
