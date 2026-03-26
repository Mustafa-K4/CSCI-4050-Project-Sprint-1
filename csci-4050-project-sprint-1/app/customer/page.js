import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../../components/LogoutButton'
import styles from '../auth-ui.module.css'
import { getPageSession } from '../../lib/auth/page-session'

export default async function CustomerHomePage() {
  const session = await getPageSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className={styles.page}>
      <section className={styles.wideCard}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Customer Home</h1>
          <LogoutButton />
        </div>
        <p className={styles.subtitle}>You are logged in as a customer.</p>

        <p className={styles.linkRow}>
          <Link className={styles.textLink} href="/profile">
            Update Profile or Change Password
          </Link>
        </p>
      </section>
    </main>
  )
}
