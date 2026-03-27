'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../app/auth-ui.module.css'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('user')
    } finally {
      router.push('/login')
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleLogout} className={styles.logoutBtn} disabled={loading}>
      {loading ? 'Logging out...' : 'Log Out'}
    </button>
  )
}
