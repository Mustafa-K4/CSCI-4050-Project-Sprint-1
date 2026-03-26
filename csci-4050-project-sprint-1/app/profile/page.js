'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

function createEmptyCard() {
  return { cardNumber: '', expirationDate: '', cvv: '' }
}

export default function ProfilePage() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [cards, setCards] = useState([createEmptyCard()])
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      setError('')

      try {
        const stored = localStorage.getItem('user')
        if (!stored) {
          setError('You must be logged in to view your profile.')
          setLoading(false)
          return
        }

        const parsed = JSON.parse(stored)
        const id = parsed?.id || parsed?._id

        if (!id) {
          setError('Could not determine logged-in user.')
          setLoading(false)
          return
        }

        setUserId(id)

        const response = await fetch(`/api/users/${id}`)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          setError(data?.error || 'Failed to load profile data.')
          setLoading(false)
          return
        }

        const fetchedUser = data.user
        const incomingAddress = Array.isArray(fetchedUser.address)
          ? fetchedUser.address.map(item => String(item || '').trim()).filter(Boolean)
          : []

        if (incomingAddress.length > 1) {
          setError('Only one address is allowed. Please keep a single address.')
        }

        const incomingCards = Array.isArray(fetchedUser.payments)
          ? fetchedUser.payments.map(card => ({
              cardNumber: String(card?.cardNumber || ''),
              expirationDate: String(card?.expirationDate || ''),
              cvv: String(card?.cvv || ''),
            }))
          : []

        if (incomingCards.length > 3) {
          setError('Only the first 3 payment cards are shown. Remove extras and save.')
        }

        setName(String(fetchedUser.name || ''))
        setEmail(String(fetchedUser.email || ''))
        setAddress(incomingAddress[0] || '')
        setCards(incomingCards.slice(0, 3).length > 0 ? incomingCards.slice(0, 3) : [createEmptyCard()])

        const favoriteMovies = Array.isArray(fetchedUser.favoriteMovies)
          ? fetchedUser.favoriteMovies
          : Array.isArray(fetchedUser.favorites)
            ? fetchedUser.favorites
            : []

        setFavorites(favoriteMovies)
      } catch (requestError) {
        setError(requestError.message || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  function addAddressAttempt() {
    if (address.trim()) {
      setError('Only one address is allowed.')
      setSuccess('')
      return
    }

    setError('Use the single address field below. Additional addresses are not allowed.')
    setSuccess('')
  }

  function addCard() {
    if (cards.length >= 3) {
      setError('You can add a maximum of 3 payment cards.')
      setSuccess('')
      return
    }

    setCards(prev => [...prev, createEmptyCard()])
    setError('')
  }

  function removeCard(index) {
    setCards(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [createEmptyCard()]
    })
    setError('')
    setSuccess('')
  }

  function updateCard(index, field, value) {
    setCards(prev =>
      prev.map((card, i) =>
        i === index
          ? {
              ...card,
              [field]: value,
            }
          : card,
      ),
    )
    setError('')
    setSuccess('')
  }

  function validateForm() {
    if (!name.trim()) return 'Name is required.'
    if (!email.trim()) return 'Email is required.'

    if (cards.length > 3) return 'You can add up to 3 cards only.'

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index]
      const hasAnyField = card.cardNumber.trim() || card.expirationDate.trim() || card.cvv.trim()
      if (!hasAnyField) continue

      const cardNumber = card.cardNumber.replace(/\s+/g, '')
      const expiry = card.expirationDate.trim()
      const cvv = card.cvv.trim()

      if (!/^\d{16}$/.test(cardNumber)) return `Card ${index + 1}: card number must be 16 digits.`
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) return `Card ${index + 1}: expiration must be MM/YY.`
      if (!/^\d{3,4}$/.test(cvv)) return `Card ${index + 1}: CVV must be 3 or 4 digits.`
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!userId) {
      setError('No logged-in user found.')
      return
    }

    setSaving(true)

    try {
      const cleanCards = cards
        .map(card => ({
          cardNumber: card.cardNumber.replace(/\s+/g, '').trim(),
          expirationDate: card.expirationDate.trim(),
          cvv: card.cvv.trim(),
        }))
        .filter(card => card.cardNumber || card.expirationDate || card.cvv)

      if (cleanCards.length > 3) {
        setError('You can add a maximum of 3 cards.')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() ? [address.trim()] : [],
          payments: cleanCards,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        setError(data?.error || 'Failed to update profile.')
        return
      }

      const updatedUser = data.user
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...(JSON.parse(localStorage.getItem('user') || '{}')),
          id: updatedUser._id,
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        }),
      )

      setSuccess('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>Loading profile...</div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Profile</h1>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Info</h2>

            <label className={styles.label}>
              Name <span className={styles.required}>*</span>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={event => setName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
              <input
                type="email"
                className={styles.input}
                value={email}
                disabled
                required
              />
            </label>

            <div className={styles.labelRow}>
              <p className={styles.labelText}>
                Address <span className={styles.required}>*</span>
              </p>
              <button type="button" className={styles.secondaryBtn} onClick={addAddressAttempt}>
                Add Another Address
              </button>
            </div>
            <input
              type="text"
              className={styles.input}
              value={address}
              onChange={event => {
                setAddress(event.target.value)
                setError('')
              }}
              placeholder="123 Main St, City, State"
              required
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment Methods</h2>
            {cards.map((card, index) => (
              <div className={styles.cardForm} key={`payment-card-${index}`}>
                <label className={styles.label}>
                  Card Number <span className={styles.required}>*</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={card.cardNumber}
                    onChange={event => updateCard(index, 'cardNumber', event.target.value)}
                    placeholder="1234 5678 9012 3456"
                  />
                </label>

                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    Expiration Date <span className={styles.required}>*</span>
                    <input
                      type="text"
                      className={styles.input}
                      value={card.expirationDate}
                      onChange={event => updateCard(index, 'expirationDate', event.target.value)}
                      placeholder="MM/YY"
                    />
                  </label>

                  <label className={styles.label}>
                    CVV <span className={styles.required}>*</span>
                    <input
                      type="text"
                      className={styles.input}
                      value={card.cvv}
                      onChange={event => updateCard(index, 'cvv', event.target.value)}
                      placeholder="123"
                    />
                  </label>
                </div>

                <button type="button" className={styles.removeBtn} onClick={() => removeCard(index)}>
                  Remove Card
                </button>
              </div>
            ))}

            <button type="button" className={styles.secondaryBtn} onClick={addCard}>
              Add Card ({cards.length}/3)
            </button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Favorites</h2>
            {favorites.length === 0 ? (
              <p className={styles.emptyText}>No favorites yet.</p>
            ) : (
              <div className={styles.favoritesGrid}>
                {favorites.map((item, index) => {
                  const title =
                    typeof item === 'string'
                      ? item
                      : item?.title || item?.name || `Favorite ${index + 1}`
                  const poster = typeof item === 'object' ? item?.poster_url || item?.poster : ''

                  return (
                    <div key={`favorite-${index}`} className={styles.favoriteItem}>
                      {poster ? (
                        <img src={poster} alt={title} className={styles.favoritePoster} />
                      ) : (
                        <div className={styles.favoritePlaceholder}>🎬</div>
                      )}
                      <p className={styles.favoriteTitle}>{title}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  )
}
