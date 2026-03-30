import Link from 'next/link'
import { redirect } from 'next/navigation'
import LoginForm from '../../components/auth/LoginForm'
import styles from '../auth-ui.module.css'
import { getPageSession } from '../../lib/auth/page-session'

export default async function LoginPage() {
  const session = await getPageSession()
  if (session?.role === 'admin') {
    redirect('/admin')
  }
  if (session?.role === 'customer') {
    redirect('/')
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Login</h1>
          <Link href="/" className={styles.closeButton} aria-label="Close login page">
            ×
          </Link>
        </div>
        <p className={styles.subtitle}>Sign in with your cinema account.</p>
        <LoginForm />
      </section>
    </main>
  )
}
