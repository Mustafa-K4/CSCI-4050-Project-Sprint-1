import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../../components/LogoutButton'
import ProfileForms from '../../components/auth/ProfileForms'
import styles from '../auth-ui.module.css'
import { getPageSession } from '../../lib/auth/page-session'

export default async function ProfilePage() {
  const session = await getPageSession()
  if (!session) {
    redirect('/login')
  }

  const homePath = session.role === 'admin' ? '/admin' : '/customer'

  return (
    <main className={styles.page}>
      <section className={styles.wideCard}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Profile Settings</h1>
          <LogoutButton />
        </div>

        <p className={styles.subtitle}>
          Update your profile and password. Required fields are marked with *
        </p>
        <p className={styles.linkRow}>
          <Link href={homePath} className={styles.textLink}>
            Back to Home
          </Link>
        </p>

        <ProfileForms />
      </section>
    </main>
  )
}
