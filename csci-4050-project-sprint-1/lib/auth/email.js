function getEmailConfig() {
  return {
    sendGridApiKey: process.env.SENDGRID_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || '',
    emailFromName: process.env.EMAIL_FROM_NAME || 'Cinema E-Booking',
  }
}

export function isEmailConfigured() {
  const config = getEmailConfig()
  return Boolean(config.sendGridApiKey && config.emailFrom)
}

function getPublicBaseUrl(baseUrl) {
  return baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

function buildFromField(emailFrom, emailFromName) {
  if (!emailFromName) {
    return { email: emailFrom }
  }

  return {
    email: emailFrom,
    name: emailFromName,
  }
}

async function sendEmail({ to, subject, plainMessage, htmlMessage, logPrefix }) {
  const { sendGridApiKey, emailFrom, emailFromName } = getEmailConfig()

  if (!sendGridApiKey || !emailFrom) {
    const error = new Error(
      'Email sending is not configured. Set SENDGRID_API_KEY and EMAIL_FROM in the app environment.',
    )
    error.code = 'EMAIL_NOT_CONFIGURED'
    throw error
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: buildFromField(emailFrom, emailFromName),
      subject,
      content: [
        { type: 'text/plain', value: plainMessage },
        ...(htmlMessage ? [{ type: 'text/html', value: htmlMessage }] : []),
      ],
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    const error = new Error(`Failed to send email: ${details}`)
    error.code = 'EMAIL_SEND_FAILED'
    error.provider = 'sendgrid'
    throw error
  }

  return { delivered: true, provider: 'sendgrid' }
}

export async function sendVerificationEmail({ to, token, baseUrl }) {
  const verifyUrl = `${getPublicBaseUrl(baseUrl)}/api/auth/register/verify?token=${token}`
  const subject = 'Verify your Cinema E-Booking account'
  const plainMessage = `Click the link to verify your account: ${verifyUrl}`
  const htmlMessage = `
    <p>Welcome to Cinema E-Booking.</p>
    <p>Please verify your account by clicking the link below:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
  `

  return sendEmail({
    to,
    subject,
    plainMessage,
    htmlMessage,
    logPrefix: 'EmailVerification',
  })
}

export async function sendProfileChangeEmail({ to, name, changedFields }) {
  const fieldList =
    Array.isArray(changedFields) && changedFields.length > 0
      ? changedFields.join(', ')
      : 'profile information'
  const subject = 'Cinema account profile updated'
  const plainMessage = `Hi ${name || 'User'}, your ${fieldList} was updated on your Cinema E-Booking account. If this was not you, please reset your password immediately.`
  const htmlMessage = `
    <p>Hi ${name || 'User'},</p>
    <p>Your ${fieldList} was updated on your Cinema E-Booking account.</p>
    <p>If this was not you, please reset your password immediately.</p>
  `

  return sendEmail({
    to,
    subject,
    plainMessage,
    htmlMessage,
    logPrefix: 'ProfileChange',
  })
}

export async function sendPasswordResetEmail({ to, token, baseUrl }) {
  const resetUrl = `${getPublicBaseUrl(baseUrl)}/reset-password?token=${token}`
  const subject = 'Reset your Cinema E-Booking password'
  const plainMessage = `Click the link to reset your password: ${resetUrl}`
  const htmlMessage = `
    <p>A password reset was requested for your Cinema E-Booking account.</p>
    <p>Use the link below to set a new password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
  `

  return sendEmail({
    to,
    subject,
    plainMessage,
    htmlMessage,
    logPrefix: 'PasswordReset',
  })
}

export async function sendBookingConfirmationEmail({ to, bookingDetails, baseUrl }) {
  const {
    movieTitle,
    showtime,
    seats,
    confirmationCode,
    totalPrice,
    customerName,
  } = bookingDetails

  const subject = `Booking Confirmation - ${confirmationCode}`
  const seatsList = Array.isArray(seats) ? seats.join(', ') : seats || 'N/A'
  
  const plainMessage = `
Hello ${customerName},

Your movie ticket booking has been confirmed!

Confirmation Code: ${confirmationCode}
Movie: ${movieTitle}
Showtime: ${showtime}
Seats: ${seatsList}
Total Price: $${totalPrice.toFixed(2)}

Thank you for booking with Cinema E-Booking!
  `.trim()

  const htmlMessage = `
    <h2>Booking Confirmed!</h2>
    <p>Hello ${customerName},</p>
    <p>Your movie ticket booking has been confirmed. Here are your details:</p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Confirmation Code:</strong> ${confirmationCode}</p>
      <p><strong>Movie:</strong> ${movieTitle}</p>
      <p><strong>Showtime:</strong> ${showtime}</p>
      <p><strong>Seats:</strong> ${seatsList}</p>
      <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
    </div>
    <p>Please arrive at the theater 15 minutes before the showtime.</p>
    <p>Thank you for booking with Cinema E-Booking!</p>
  `

  return sendEmail({
    to,
    subject,
    plainMessage,
    htmlMessage,
    logPrefix: 'BookingConfirmation',
  })
}
