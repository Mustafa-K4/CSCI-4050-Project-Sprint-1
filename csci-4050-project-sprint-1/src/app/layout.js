import './globals.css'

export const metadata = {
  title: 'Cinema E-Booking System',
  description: 'Book movie tickets online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}