import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../../components/LogoutButton'
import AdminPortalNav from '../../components/admin/AdminPortalNav'
import shellStyles from '../../components/admin/AdminPortal.module.css'
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
        <div className={shellStyles.pageHeader}>
          <div>
            <p className={shellStyles.eyebrow}>Admin Access</p>
            <h1 className={shellStyles.title}>Admin Portal Home</h1>
            <p className={shellStyles.subtitle}>
              Use the menu below to manage movies and showtimes from one place.
            </p>
          </div>
          <div className={shellStyles.headerActions}>
            <LogoutButton />
          </div>
        </div>

        <AdminPortalNav currentPath="/admin" />

        <div className={shellStyles.hero}>
          <div>
            <p className={styles.subtitle}>
              Add movies, schedule showtimes, and manage the core admin workflow from one place.
            </p>
            <p className={shellStyles.heroNote}>
              Validation, conflict prevention, and clear prompts are built into the admin workflow.
            </p>
          </div>
          <div className={shellStyles.statusBadge}>Admin Tools</div>
        </div>

        <div className={shellStyles.grid}>
          <Link href="/admin/movies" className={shellStyles.cardLink}>
            <article className={shellStyles.panel}>
              <div className={shellStyles.panelTop}>
                <span className={shellStyles.panelIcon}>MM</span>
                <span className={shellStyles.panelLabel}>Catalog</span>
              </div>
              <h2 className={shellStyles.panelTitle}>Manage Movies</h2>
              <p className={shellStyles.panelText}>
                Add movies with the required details and confirm they are stored in the database.
              </p>
            </article>
          </Link>

          <Link href="/admin/promotions" className={shellStyles.cardLink}>
            <article className={shellStyles.panel}>
              <div className={shellStyles.panelTop}>
                <span className={shellStyles.panelIcon}>PR</span>
                <span className={shellStyles.panelLabel}>Marketing</span>
              </div>
              <h2 className={shellStyles.panelTitle}>Manage Promotions</h2>
              <p className={shellStyles.panelText}>
                Review promotion tools and keep this section available from the main admin menu.
              </p>
            </article>
          </Link>

          <Link href="/admin/users" className={shellStyles.cardLink}>
            <article className={shellStyles.panel}>
              <div className={shellStyles.panelTop}>
                <span className={shellStyles.panelIcon}>US</span>
                <span className={shellStyles.panelLabel}>Accounts</span>
              </div>
              <h2 className={shellStyles.panelTitle}>Manage Users</h2>
              <p className={shellStyles.panelText}>
                Keep user-related administration accessible from the same admin workspace.
              </p>
            </article>
          </Link>

          <Link href="/admin/showtimes" className={shellStyles.cardLink}>
            <article className={shellStyles.panel}>
              <div className={shellStyles.panelTop}>
                <span className={shellStyles.panelIcon}>ST</span>
                <span className={shellStyles.panelLabel}>Scheduling</span>
              </div>
              <h2 className={shellStyles.panelTitle}>Manage Showtimes</h2>
              <p className={shellStyles.panelText}>
                Schedule movies into seeded showrooms and block conflicting date and time slots.
              </p>
            </article>
          </Link>
        </div>
      </section>
    </main>
  )
}
