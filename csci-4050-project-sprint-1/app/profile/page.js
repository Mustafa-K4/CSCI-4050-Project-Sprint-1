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
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      setError('')
      setSuccess('')

      try {
        const storedUser = getStoredUser()

        if (!storedUser) {
          setError('You must be logged in to view your profile.')
          return
        }

        const id = getUserId(storedUser)

        if (!id) {
          setError('Could not determine logged-in user.')
          return
        }

        setUserId(id)

        const response = await fetch(`/api/users/${id}`)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          setError(data?.error || 'Failed to load profile data.')
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

        setCards(incomingCards)

        const favoriteItems = Array.isArray(fetchedUser.favoriteMovies)
          ? fetchedUser.favoriteMovies
          : Array.isArray(fetchedUser.favorites)
            ? fetchedUser.favorites
            : []

        setFavorites(favoriteItems)
      } catch (requestError) {
        setError(requestError.message || 'Failed to load profile.')
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

  async function handleSaveChanges() {
    setError('')
    setSuccess('')

    if (!userId) {
      setError('Could not determine logged-in user.')
      return
    }

    if (!profile.name.trim()) {
      setError('Name is required.')
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
        setError(data?.error || 'Failed to save profile changes.')
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

      setCards(updatedCards)
      setSuccess('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to save profile changes.')
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
          </div>
          {userId && (
            <div className={styles.userBadge}>
              <span className={styles.userBadgeLabel}>User ID</span>
              <span className={styles.userBadgeValue}>{userId}</span>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <div className={styles.layout}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile details</h2>
            <form className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
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
                <span className={styles.label}>Address</span>
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

            {cards.length === 0 ? (
              <p className={styles.emptyText}>No payment cards on file.</p>
            ) : (
              <div className={styles.cardList}>
                {cards.map((card, index) => (
                  <article key={`card-${index}`} className={styles.cardItem}>
                    <p className={styles.cardTitle}>Card {index + 1}</p>
                    <p className={styles.cardNumber}>{formatCardNumber(card?.cardNumber)}</p>
                    <p className={styles.cardMeta}>Expires {card?.expirationDate || 'N/A'}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.section} ${styles.fullWidth}`}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Favorites</h2>
              <span className={styles.sectionMeta}>{favorites.length} total</span>
            </div>

            {favorites.length === 0 ? (
              <p className={styles.emptyText}>No favorites yet.</p>
            ) : (
              <ul className={styles.favoriteList}>
                {favorites.map((item, index) => (
                  <li key={`favorite-${index}`} className={styles.favoriteItem}>
                    {getFavoriteLabel(item, index)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveChanges}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
    </main>
  )
}
