'use client'

import { useEffect, useState } from 'react'
import styles from '../../app/auth-ui.module.css'

export default function ProfileForms() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loadError, setLoadError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let active = true
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        if (!response.ok) {
          if (active) {
            setLoadError(data.error || 'Unable to load profile.')
          }
          return
        }
        if (active) {
          setName(data.name || '')
          setEmail(data.email || '')
        }
      } catch {
        if (active) {
          setLoadError('Unable to load profile.')
        }
      }
    }
    loadProfile()
    return () => {
      active = false
    }
  }, [])

  async function updateProfile(event) {
    event.preventDefault()
    setProfileError('')
    setProfileMessage('')
    setLoadingProfile(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setProfileError(data.error || 'Unable to update profile.')
        return
      }
      setProfileMessage(data.message || 'Profile updated.')
    } catch {
      setProfileError('Unable to update profile.')
    } finally {
      setLoadingProfile(false)
    }
  }

  async function updatePassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setLoadingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setPasswordError(data.error || 'Unable to change password.')
        return
      }
      setPasswordMessage(data.message || 'Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError('Unable to change password.')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <>
      {loadError ? <p className={styles.error}>{loadError}</p> : null}

      <section className={styles.section}>
        <h2 className={styles.title}>Update Profile</h2>
        <form onSubmit={updateProfile} className={styles.form}>
          <label className={styles.label}>
            Name
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className={styles.label}>
            Email
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {profileError ? <p className={styles.error}>{profileError}</p> : null}
          {profileMessage ? <p className={styles.message}>{profileMessage}</p> : null}

          <button type="submit" className={styles.button} disabled={loadingProfile}>
            {loadingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Change Password</h2>
        <form onSubmit={updatePassword} className={styles.form}>
          <label className={styles.label}>
            Current Password
            <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

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

          {passwordError ? <p className={styles.error}>{passwordError}</p> : null}
          {passwordMessage ? <p className={styles.message}>{passwordMessage}</p> : null}

          <button type="submit" className={styles.button} disabled={loadingPassword}>
            {loadingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>
    </>
  )
}
