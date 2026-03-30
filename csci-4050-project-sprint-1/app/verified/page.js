import Link from 'next/link'
import styles from '../auth-ui.module.css'

export default async function VerifiedPage({ searchParams }) {
  const params = await searchParams
  const status = params?.status === 'success' ? 'success' : 'invalid'
  const isSuccess = status === 'success'

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>
          {isSuccess ? 'Account Verified' : 'Verification Failed'}
        </h1>
        <p className={styles.subtitle}>
          {isSuccess
            ? 'You are now verified. You can return to the Cinema E-Booking homepage.'
            : 'This verification link is invalid or expired. Please register again or request a new link.'}
        </p>

        <div className={styles.buttonRow}>
          <Link href="/" className={styles.buttonLink}>
            Return to Homepage
          </Link>
        </div>
      </section>
    </main>
  )
}
