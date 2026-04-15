import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '../../../components/LogoutButton';
import AdminShowtimeManager from '../../../components/admin/AdminShowtimeManager';
import AdminPortalNav from '../../../components/admin/AdminPortalNav';
import shellStyles from '../../../components/admin/AdminPortal.module.css';
import authStyles from '../../auth-ui.module.css';
import { getPageSession } from '../../../lib/auth/page-session';

export default async function AdminShowtimesPage() {
  const session = await getPageSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role !== 'admin') {
    redirect('/customer');
  }

  return (
    <main className={authStyles.page}>
      <section className={authStyles.wideCard}>
        <div className={shellStyles.pageHeader}>
          <div>
            <p className={shellStyles.eyebrow}>Admin Portal</p>
            <h1 className={shellStyles.title}>Manage Showtimes</h1>
            <p className={shellStyles.subtitle}>
              Schedule movies into available showrooms using a simple workflow with conflict checks.
            </p>
          </div>
          <div className={shellStyles.headerActions}>
            <Link href="/admin" className={shellStyles.pillLink}>
              Back to Portal
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminPortalNav currentPath="/admin/showtimes" />
        <AdminShowtimeManager />
      </section>
    </main>
  );
}
