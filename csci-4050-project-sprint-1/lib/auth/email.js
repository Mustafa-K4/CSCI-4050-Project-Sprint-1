export async function sendVerificationEmail({ to, token }) {
  const subject = 'Verify your Cinema E‑Booking account'
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register/verify?token=${token}`

  const plainMessage = `Click the link to verify your account: ${verifyUrl}`

  const sendGridApiKey = process.env.SENDGRID_API_KEY
  const emailFrom = process.env.EMAIL_FROM

  if (!sendGridApiKey || !emailFrom) {
    console.log(`[EmailVerification] to=${to} subject="${subject}" body="${plainMessage}"`)
    return { delivered: false, provider: 'console' }
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: emailFrom },
      subject,
      content: [{ type: 'text/plain', value: plainMessage }],
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to send verification email: ${details}`)
  }

  return { delivered: true, provider: 'sendgrid' }
}
