'use client'

import { useEffect, useState } from 'react'
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
  })
  const [cards, setCards] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      setError('')
      setSuccess('')

      try {
        const storedUser = getStoredUser()

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
      } catch (requestError) {
        setError(requestError.message || 'We could not load your profile right now. Please try again.')
      } finally {
        setLoading(false)
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
    setCards(prev =>
      prev.map((card, currentIndex) =>
        currentIndex === index
          ? {
              ...card,
              [field]: value,
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
            <p className={styles.subtitle}>Manage your personal details with local page state only.</p>
            <p className={styles.helperText}>
              Fields marked <span className={styles.required}>*</span> are required.
            </p>
          </div>
          {userId && (
            <div className={styles.userBadge}>
              <span className={styles.userBadgeLabel}>User ID</span>
              <span className={styles.userBadgeValue}>{userId}</span>
            </div>
          )}
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
