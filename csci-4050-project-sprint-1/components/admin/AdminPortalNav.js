import Link from 'next/link';
import styles from './AdminPortal.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Home' },
  { href: '/admin/movies', label: 'Manage Movies' },
  { href: '/admin/showtimes', label: 'Manage Showtimes' },
  { href: '/admin/promotions', label: 'Manage Promotions' },
  { href: '/admin/users', label: 'Manage Users' },
];

export default function AdminPortalNav({ currentPath }) {
  return (
    <nav className={styles.navRow} aria-label="Admin portal navigation">
      {NAV_ITEMS.map((item) => {
        const className =
          item.href === currentPath
            ? `${styles.navLink} ${styles.navLinkActive}`
            : styles.navLink;

        return (
          <Link key={item.href} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
