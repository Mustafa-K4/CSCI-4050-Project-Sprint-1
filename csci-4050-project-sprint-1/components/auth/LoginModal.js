'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from '../../app/auth-ui.module.css'
import modalStyles from './LoginModal.module.css'

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setErrorCode('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Login failed.')
        setErrorCode(data.code || '')
        return
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      setMessage('Login successful!')
      setIdentifier('')
      setPassword('')
      
      // Notify parent component of successful login
      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(), 500)
      }
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    setError('')
    setErrorCode('')
    setMessage('')
    setResendLoading(true)

    try {
      const response = await fetch('/api/auth/register/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to resend verification email.')
        return
      }

      setMessage(data.message || 'A new verification email has been sent.')
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={modalStyles.backdrop} onClick={handleBackdropClick}>
      <div className={modalStyles.modal}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Login</h1>
          <button
            type="button"
            className={modalStyles.closeButton}
            onClick={onClose}
            aria-label="Close login modal"
          >
            ×
          </button>
        </div>
        <p className={styles.subtitle}>Sign in with your cinema account.</p>

        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Username or Email
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label className={styles.label}>
            Password
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.message}>{message}</p> : null}

          {errorCode === 'ACCOUNT_NOT_VERIFIED' && identifier.trim() ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending Verification Email...' : 'Resend Verification Email'}
            </button>
          ) : null}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className={styles.linkRow}>
            <Link className={styles.textLink} href="/forgot-password" target="_blank">
              Forgot my password
            </Link>
          </p>

          <p className={styles.linkRow}>
            Don't have an account?{' '}
            <Link className={styles.textLink} href="/register" target="_blank">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
