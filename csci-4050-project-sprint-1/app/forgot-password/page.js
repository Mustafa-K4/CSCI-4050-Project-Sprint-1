'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from '../auth-ui.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to process password reset request.')
        return
      }
      setMessage(data.message || 'Password reset request submitted.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Forgot Password</h1>
          <Link href="/login" className={styles.closeButton} aria-label="Close forgot password page">
            ×
          </Link>
        </div>
        <p className={styles.subtitle}>Enter your email to request a password reset link.</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.message}>{message}</p> : null}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Requesting...' : 'Request Password Reset'}
          </button>
        </form>

        <p className={styles.linkRow}>
          <Link href="/login" className={styles.textLink}>
            Back to Login
          </Link>
        </p>
      </section>
    </main>
  )
}
