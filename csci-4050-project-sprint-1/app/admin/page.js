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
          <div>
            <p className={styles.eyebrow}>Admin Access</p>
            <h1 className={styles.title}>Admin Portal Home</h1>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryActionLink} href="/">
              View Website
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className={styles.dashboardHero}>
          <div>
            <p className={styles.subtitle}>
              Welcome, admin. Use the menu below to manage the system.
            </p>
            <p className={styles.heroNote}>
              This prototype demonstrates the required admin navigation for the sprint review.
            </p>
          </div>
          <div className={styles.statusBadge}>Prototype Ready</div>
        </div>

        <div className={styles.adminGrid}>
          <article className={styles.adminPanel}>
            <div className={styles.adminPanelTop}>
              <span className={styles.adminPanelIcon}>MM</span>
              <span className={styles.adminPanelLabel}>Catalog</span>
            </div>
            <h2 className={styles.adminPanelTitle}>Manage Movies</h2>
            <p className={styles.adminPanelText}>
              Maintain movie listings, release details, and presentation content.
            </p>
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelTop}>
              <span className={styles.adminPanelIcon}>PR</span>
              <span className={styles.adminPanelLabel}>Marketing</span>
            </div>
            <h2 className={styles.adminPanelTitle}>Promotions</h2>
            <p className={styles.adminPanelText}>
              Prepare offers, announcement timing, and customer-facing promotions.
            </p>
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelTop}>
              <span className={styles.adminPanelIcon}>US</span>
              <span className={styles.adminPanelLabel}>Accounts</span>
            </div>
            <h2 className={styles.adminPanelTitle}>Users</h2>
            <p className={styles.adminPanelText}>
              Review user records, account roles, and profile-level administration.
            </p>
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelTop}>
              <span className={styles.adminPanelIcon}>ST</span>
              <span className={styles.adminPanelLabel}>Scheduling</span>
            </div>
            <h2 className={styles.adminPanelTitle}>Showtimes</h2>
            <p className={styles.adminPanelText}>
              Manage screening times and the schedule displayed to customers.
            </p>
          </article>
        </div>

        <p className={styles.linkRow}>
          <Link className={styles.textLink} href="/profile">
            Profile Settings
          </Link>
        </p>
      </section>
    </main>
  )
}
