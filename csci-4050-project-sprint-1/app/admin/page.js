import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../../components/LogoutButton'
import styles from '../auth-ui.module.css'
import { getPageSession } from '../../lib/auth/page-session'

export default async function AdminHomePage() {
  const session = await getPageSession()
  if (!session) {
    redirect('/login')
  }
  if (session.role !== 'admin') {
    redirect('/customer')
  }

  return (
    <main className={styles.page}>
      <section className={styles.wideCard}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Admin Portal Home (Prototype)</h1>
          <LogoutButton />
        </div>

        <p className={styles.subtitle}>Welcome, admin. Use the menu below to manage the system.</p>
        <ul className={styles.menuList}>
          <li>Manage Movies</li>
          <li>Promotions</li>
          <li>Users</li>
          <li>Showtimes</li>
        </ul>

        <p className={styles.linkRow}>
          <Link className={styles.textLink} href="/profile">
            Profile Settings
          </Link>
        </p>
      </section>
    </main>
  )
}
