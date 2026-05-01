import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '../../../components/LogoutButton';
import AdminPromotionManager from '../../../components/admin/AdminPromotionManager';
import AdminPortalNav from '../../../components/admin/AdminPortalNav';
import shellStyles from '../../../components/admin/AdminPortal.module.css';
import authStyles from '../../auth-ui.module.css';
import { getPageSession } from '../../../lib/auth/page-session';

export default async function AdminPromotionsPage() {
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
            <h1 className={shellStyles.title}>Manage Promotions</h1>
            <p className={shellStyles.subtitle}>
              Add promotions and send them to subscribed customers.
            </p>
          </div>
          <div className={shellStyles.headerActions}>
            <Link href="/admin" className={shellStyles.pillLink}>
              Back to Portal
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminPortalNav currentPath="/admin/promotions" />

        <AdminPromotionManager />
      </section>
    </main>
  );
}
