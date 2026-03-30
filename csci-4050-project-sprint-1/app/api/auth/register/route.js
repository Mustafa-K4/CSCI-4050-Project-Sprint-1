import crypto from 'crypto'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { sendVerificationEmail } from '../../../../lib/auth/email'
import { hashPassword, validatePasswordStrength } from '../../../../lib/auth/passwords'

function buildFullName(firstName, lastName, name) {
  const splitName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return splitName || name || ''
}

function normalizeUsernameBase(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  return normalized || 'user'
}

async function createUniqueUsername({ email, firstName, lastName, requestedUsername }) {
  const emailBase = String(email || '').split('@')[0]
  const baseUsername = normalizeUsernameBase(
    requestedUsername || `${firstName || ''}${lastName || ''}` || emailBase
  )

  let nextUsername = baseUsername
  let suffix = 1

  while (await User.exists({ username: nextUsername })) {
    nextUsername = `${baseUsername}${suffix}`
    suffix += 1
  }

  return nextUsername
}

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim()
    const name = buildFullName(firstName, lastName, body.name?.trim())
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const confirmPassword = body.confirmPassword
    const promotionsOptIn =
      body.promotionsOptIn === true ||
      body.promotionSubscription === true ||
      String(body.promotionSubscription || '').toLowerCase() === 'yes'

    if (!name || !email || !password || !confirmPassword) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return Response.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const username = await createUniqueUsername({
      email,
      firstName,
      lastName,
      requestedUsername: body.username,
    })
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex')
    const baseUrl = new URL(request.url).origin

    const user = await User.create({
      name,
      firstName: firstName || '',
      lastName: lastName || '',
      username,
      email,
      pswrd: hashedPassword,
      role: 'customer',
      status: 'Inactive',
      verification: 'unverified',
      promotionsOptIn,
      resetTokenHash: verificationTokenHash,
      resetTokenExpiresAt: Date.now() + 1000 * 60 * 60 * 24
    })

    try {
      await sendVerificationEmail({
        to: email,
        token: verificationToken,
        baseUrl,
      })
    } catch (emailError) {
      await User.findByIdAndDelete(user._id)
      return Response.json(
        { error: emailError.message || 'Unable to send verification email.' },
        { status: 500 }
      )
    }

    return Response.json(
      {
        success: true,
        status: 'Inactive',
        message: 'Registration successful. Check your email to verify your account.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
