'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from '../auth-ui.module.css'

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    promotionsOptIn: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(event) {
    const { name, type, value, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Registration failed.')
        return
      }

      setSuccess('Registration successful. Check your email to activate your account.')
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        promotionsOptIn: false,
      })
    } catch {
      setError('Unable to register right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Sign Up</h1>
          <Link href="/login" className={styles.closeButton} aria-label="Close registration page">
            ×
          </Link>
        </div>

        <p className={styles.subtitle}>
          Create your account. Required fields are marked with <span className={styles.required}>*</span>
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            First Name
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
          </label>

          <label className={styles.label}>
            Last Name
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </label>

          <label className={styles.label}>
            Email
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            Password
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </label>

          <label className={styles.label}>
            Confirm Password
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              className={styles.checkboxInput}
              type="checkbox"
              name="promotionsOptIn"
              checked={form.promotionsOptIn}
              onChange={handleChange}
            />
            <span>Send me promotions and special offers</span>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.message}>{success}</p> : null}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.linkRow}>
          <Link href="/login" className={styles.textLink}>
            Already have an account? Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
