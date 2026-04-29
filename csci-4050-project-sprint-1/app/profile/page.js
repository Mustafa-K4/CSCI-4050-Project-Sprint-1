'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import LogoutButton from '../../components/LogoutButton'
import {
  normalizeCardNumberInput,
  normalizeCvvInput,
  normalizeExpirationInput,
} from '../../lib/security/payment-card'
import styles from './page.module.css'

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

function getUserId(user) {
  return user?.id || user?._id || user?.userId || ''
}

function createEmptyCard() {
  return {
    cardNumber: '',
    expirationDate: '',
    cvv: '',
  }
}

function formatCardNumber(cardNumber) {
  const digits = String(cardNumber || '').replace(/\D/g, '')

  if (!digits) return 'No card number available'
  if (digits.length <= 4) return digits

  return `•••• •••• •••• ${digits.slice(-4)}`
}

function getFavoriteLabel(item, index) {
  if (typeof item === 'string' && item.trim()) return item.trim()
  if (item && typeof item === 'object') {
    return item.title || item.name || item.movieTitle || item.id || `Favorite ${index + 1}`
  }

  return `Favorite ${index + 1}`
}

function getFavoriteSubtitle(item) {
  if (!item || typeof item !== 'object') return 'Saved movie'

  return item.genre || item.year || item.release_date || item.rating || 'Saved movie'
}

function formatSeatLabel(seat) {
  const match = String(seat || '').match(/^(\d+)-(\d+)$/)
  if (!match) return String(seat || '')

  const rowIndex = Number(match[1])
  const colIndex = Number(match[2])
  return `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
}

function formatShowtime(value) {
  if (!value) return 'Showtime unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getOrderMovieTitle(order) {
  return order?.movieId?.title || order?.movieTitle || 'Movie'
}

function formatTicketBreakdown(ticketTypes) {
  const types = [
    ['adult', 'Adult'],
    ['child', 'Child'],
    ['senior', 'Senior'],
  ]

  const labels = types
    .map(([key, label]) => {
      const count = Number(ticketTypes?.[key] || 0)
      return count > 0 ? `${count} ${label}` : ''
    })
    .filter(Boolean)

  return labels.length > 0 ? labels.join(', ') : 'No ticket details'
}

export default function ProfilePage() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    address: '',
    currentPassword: '',
  })
  const [cards, setCards] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      setError('')
      setSuccess('')

      try {
        let storedUser = getStoredUser()

        if (!storedUser) {
          const sessionResponse = await fetch('/api/profile')
          const sessionData = await sessionResponse.json()

          if (sessionResponse.ok && sessionData?.id) {
            storedUser = sessionData
            localStorage.setItem('user', JSON.stringify(sessionData))
          }
        }

        if (!storedUser) {
          setError('Please sign in to view your profile.')
          return
        }

        const id = getUserId(storedUser)

        if (!id) {
          setError('We could not determine the current user. Please sign in again.')
          return
        }

        setUserId(id)

        const response = await fetch(`/api/users/${id}`)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          setError(data?.error || 'We could not load your profile details right now. Please try again.')
          return
        }

        const fetchedUser = data.user
        const incomingAddress = Array.isArray(fetchedUser.address)
          ? fetchedUser.address.map(item => String(item || '').trim()).filter(Boolean)
          : typeof fetchedUser.address === 'string' && fetchedUser.address.trim()
            ? [fetchedUser.address.trim()]
            : []

        setProfile({
          name: String(fetchedUser.name || ''),
          email: String(fetchedUser.email || ''),
          address: incomingAddress[0] || '',
          currentPassword: '',
        })

        const incomingCards = Array.isArray(fetchedUser.payments)
          ? fetchedUser.payments.slice(0, 3)
          : Array.isArray(fetchedUser.paymentCards)
            ? fetchedUser.paymentCards.slice(0, 3)
            : []

        setCards(incomingCards.length > 0 ? incomingCards : [createEmptyCard()])

        const favoriteItems = Array.isArray(fetchedUser.favoriteMovies)
          ? fetchedUser.favoriteMovies
          : Array.isArray(fetchedUser.favorites)
            ? fetchedUser.favorites
            : []

        setFavoriteMovies(favoriteItems)

        setOrdersLoading(true)
        const ordersResponse = await fetch(`/api/bookings?userId=${id}&status=confirmed`)
        const ordersData = await ordersResponse.json()

        if (ordersResponse.ok) {
          setOrderHistory(Array.isArray(ordersData.bookings) ? ordersData.bookings : [])
        } else {
          setOrderHistory([])
        }
      } catch (requestError) {
        setError(requestError.message || 'We could not load your profile right now. Please try again.')
      } finally {
        setLoading(false)
        setOrdersLoading(false)
      }
    }

    loadUser()
  }, [])

  function updateProfileField(field, value) {
    setError('')
    setSuccess('')
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  function addPaymentCard() {
    if (cards.length >= 3) {
      setError('You can add a maximum of 3 payment cards.')
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')
    setCards(prev => [...prev, createEmptyCard()])
  }

  function updatePaymentCard(index, field, value) {
    setError('')
    setSuccess('')
    const nextValue = field === 'cardNumber'
      ? normalizeCardNumberInput(value)
      : field === 'expirationDate'
        ? normalizeExpirationInput(value)
        : field === 'cvv'
          ? normalizeCvvInput(value)
          : value

    setCards(prev =>
      prev.map((card, currentIndex) =>
        currentIndex === index
          ? {
              ...card,
              [field]: nextValue,
            }
          : card,
      ),
    )
  }

  function removePaymentCard(index) {
    setError('')
    setSuccess('')
    setCards(prev => {
      const nextCards = prev.filter((_, currentIndex) => currentIndex !== index)
      return nextCards.length > 0 ? nextCards : [createEmptyCard()]
    })
  }

  async function handleSaveChanges() {
    setError('')
    setSuccess('')

    if (!userId) {
      setError('We could not determine the current user. Please sign in again.')
      return
    }

    if (!profile.name.trim()) {
      setError('Please enter your name before saving.')
      return
    }

    if (!profile.currentPassword.trim()) {
      setError('Please enter your current password before saving.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          address: profile.address.trim(),
          currentPassword: profile.currentPassword,
          paymentCards: cards.map(card => ({
            cardNumber: String(card?.cardNumber || '').trim(),
            expirationDate: String(card?.expirationDate || '').trim(),
            cvv: String(card?.cvv || '').trim(),
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        setError(data?.error || 'We could not save your profile changes. Please review your details and try again.')
        return
      }

      const updatedUser = data.user || {}
      const updatedAddress = Array.isArray(updatedUser.address)
        ? updatedUser.address.map(item => String(item || '').trim()).filter(Boolean)
        : typeof updatedUser.address === 'string' && updatedUser.address.trim()
          ? [updatedUser.address.trim()]
          : []

      setProfile(prev => ({
        ...prev,
        name: String(updatedUser.name || prev.name),
        address: updatedAddress[0] || '',
        currentPassword: '',
      }))

      const updatedCards = Array.isArray(updatedUser.paymentCards)
        ? updatedUser.paymentCards.slice(0, 3)
        : Array.isArray(updatedUser.payments)
          ? updatedUser.payments.slice(0, 3)
          : cards

      setCards(updatedCards.length > 0 ? updatedCards : [createEmptyCard()])
      setSuccess('Your profile changes have been saved successfully.')
    } catch (requestError) {
      setError(requestError.message || 'We could not save your profile changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <p className={styles.statusText}>Loading profile...</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Account</p>
            <h1 className={styles.title}>Profile</h1>
            <p className={styles.subtitle}>Manage your personal details</p>
            <p className={styles.helperText}>
              Fields marked <span className={styles.required}>*</span> are required.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/" className={styles.homeButton}>
              Return Home
            </Link>
            <LogoutButton />
            {userId && (
              <div className={styles.userBadge}>
                <span className={styles.userBadgeLabel}>User ID</span>
                <span className={styles.userBadgeValue}>{userId}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className={`${styles.notice} ${styles.error}`} role="alert" aria-live="polite">
            <p className={styles.noticeTitle}>There was a problem</p>
            <p className={styles.noticeText}>{error}</p>
          </div>
        )}
        {success && (
          <div className={`${styles.notice} ${styles.success}`} role="status" aria-live="polite">
            <p className={styles.noticeTitle}>Changes saved</p>
            <p className={styles.noticeText}>{success}</p>
          </div>
        )}

        <div className={styles.layout}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile details</h2>
            <form className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Name <span className={styles.required}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  value={profile.name}
                  onChange={event => updateProfileField('name', event.target.value)}
                  placeholder="Enter your name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  type="email"
                  className={styles.input}
                  value={profile.email}
                  disabled
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Address
                </span>
                <input
                  type="text"
                  className={styles.input}
                  value={profile.address}
                  onChange={event => updateProfileField('address', event.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Current password <span className={styles.required}>*</span>
                </span>
                <input
                  type="password"
                  className={styles.input}
                  value={profile.currentPassword}
                  onChange={event => updateProfileField('currentPassword', event.target.value)}
                  placeholder="Enter your current password"
                />
              </label>
            </form>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Payment cards</h2>
              <span className={styles.sectionMeta}>{cards.length}/3 shown</span>
            </div>

            <div className={styles.cardList}>
              {cards.map((card, index) => (
                <article key={`card-${index}`} className={styles.cardItem}>
                  <div className={styles.cardHeader}>
                    <p className={styles.cardTitle}>Card {index + 1}</p>
                    {cards.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeCardButton}
                        onClick={() => removePaymentCard(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <label className={styles.field}>
                    <span className={styles.label}>
                      Card number <span className={styles.required}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={card.cardNumber || ''}
                      onChange={event => updatePaymentCard(index, 'cardNumber', event.target.value)}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      maxLength={19}
                    />
                  </label>

                  <div className={styles.cardGrid}>
                    <label className={styles.field}>
                      <span className={styles.label}>
                        Expiration date <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="text"
                        className={styles.input}
                        value={card.expirationDate || ''}
                        onChange={event => updatePaymentCard(index, 'expirationDate', event.target.value)}
                        placeholder="MM/YY"
                        inputMode="numeric"
                        maxLength={5}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>
                        CVV <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="text"
                        className={styles.input}
                        value={card.cvv || ''}
                        onChange={event => updatePaymentCard(index, 'cvv', event.target.value)}
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </label>
                  </div>

                  <p className={styles.cardPreview}>{formatCardNumber(card?.cardNumber)}</p>
                  <p className={styles.cardMeta}>Expires {card?.expirationDate || 'N/A'}</p>
                </article>
              ))}
            </div>

            <button
              type="button"
              className={styles.addCardButton}
              onClick={addPaymentCard}
              disabled={cards.length >= 3}
            >
              Add Card
            </button>
          </section>

          <section className={`${styles.section} ${styles.fullWidth}`}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Order History</h2>
              <span className={styles.sectionMeta}>{orderHistory.length} confirmed</span>
            </div>

            {ordersLoading ? (
              <p className={styles.emptyText}>Loading order history...</p>
            ) : orderHistory.length === 0 ? (
              <p className={styles.emptyText}>No confirmed bookings yet.</p>
            ) : (
              <div className={styles.orderGrid}>
                {orderHistory.map((order) => (
                  <article key={order._id || order.confirmationCode} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <p className={styles.orderEyebrow}>Confirmation</p>
                        <h3 className={styles.orderCode}>{order.confirmationCode || 'Pending code'}</h3>
                      </div>
                      <span className={styles.orderStatus}>{order.status || 'confirmed'}</span>
                    </div>

                    <div className={styles.orderDetails}>
                      <p>
                        <span>Movie</span>
                        {getOrderMovieTitle(order)}
                      </p>
                      <p>
                        <span>Showtime</span>
                        {formatShowtime(order.showtime)}
                      </p>
                      <p>
                        <span>Seats</span>
                        {Array.isArray(order.seats) && order.seats.length > 0
                          ? order.seats.map(formatSeatLabel).join(', ')
                          : 'No seats listed'}
                      </p>
                      <p>
                        <span>Tickets</span>
                        {formatTicketBreakdown(order.ticketTypes)}
                      </p>
                    </div>

                    <div className={styles.orderTotal}>
                      <span>Total Paid</span>
                      <strong>${Number(order.totalAmount || 0).toFixed(2)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.section} ${styles.fullWidth}`}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Favorite Movies</h2>
              <span className={styles.sectionMeta}>{favoriteMovies.length} total</span>
            </div>

            {favoriteMovies.length === 0 ? (
              <p className={styles.emptyText}>No favorite movies yet.</p>
            ) : (
              <div className={styles.favoriteGrid}>
                {favoriteMovies.map((item, index) => (
                  <article key={`favorite-${index}`} className={styles.favoriteCard}>
                    <p className={styles.favoriteTitle}>{getFavoriteLabel(item, index)}</p>
                    <p className={styles.favoriteSubtitle}>{getFavoriteSubtitle(item)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveChanges}
            disabled={saving || loading}
            aria-disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
    </main>
  )
}
