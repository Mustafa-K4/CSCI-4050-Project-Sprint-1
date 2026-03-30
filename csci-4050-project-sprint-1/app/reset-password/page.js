'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import styles from '../auth-ui.module.css'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to reset password.')
        return
      }
      setMessage(data.message || 'Password reset successful.')
      setTimeout(() => router.push('/login'), 1200)
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
          <h1 className={styles.title}>Reset Password</h1>
          <Link href="/login" className={styles.closeButton} aria-label="Close reset password page">
            ×
          </Link>
        </div>
        <p className={styles.subtitle}>Set a new password for your account.</p>

        {!token ? (
          <p className={styles.error}>Reset token missing. Request a new password reset link.</p>
        ) : (
          <form onSubmit={onSubmit} className={styles.form}>
            <label className={styles.label}>
              New Password
              <span className={styles.required}>*</span>
              <input
                className={styles.input}
                type="password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <label className={styles.label}>
              Confirm New Password
              <span className={styles.required}>*</span>
              <input
                className={styles.input}
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}
            {message ? <p className={styles.message}>{message}</p> : null}

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className={styles.linkRow}>
          <Link href="/login" className={styles.textLink}>
            Back to Login
          </Link>
        </p>
      </section>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Reset Password</h1>
              <Link href="/login" className={styles.closeButton} aria-label="Close reset password page">
                ×
              </Link>
            </div>
            <p className={styles.subtitle}>Loading reset form...</p>
          </section>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
