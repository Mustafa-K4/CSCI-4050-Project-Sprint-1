export async function sendProfileChangeEmail({ to, name, changedFields }) {
  const fieldList = changedFields.join(', ')
  const subject = 'Cinema account profile updated'
  const plainMessage = `Hi ${name || 'User'}, your profile information was updated (${fieldList}). If this was not you, reset your password immediately.`

  const sendGridApiKey = process.env.SENDGRID_API_KEY
  const emailFrom = process.env.EMAIL_FROM

  if (!sendGridApiKey || !emailFrom) {
    console.log(`[EmailNotification] to=${to} subject="${subject}" body="${plainMessage}"`)
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
    throw new Error(`Failed to send profile update email: ${details}`)
  }

  return { delivered: true, provider: 'sendgrid' }
}
