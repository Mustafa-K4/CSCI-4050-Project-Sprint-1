'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../../app/auth-ui.module.css'

export default function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
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
        return
      }

      setMessage('Login successful. Redirecting...')
      router.push(data.redirectTo || '/customer')
      router.refresh()
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
        />
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className={styles.linkRow}>
        <Link className={styles.textLink} href="/forgot-password">
          Forgot my password
        </Link>
      </p>
    </form>
  )
}
