import crypto from 'crypto'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../../database/db'
import User from '../../../../../models/user'
import { sendVerificationEmail } from '../../../../../lib/auth/email'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const identifier = String(body.identifier || '').trim()
    const normalizedEmail = identifier.toLowerCase()

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or username is required.' },
        { status: 400 }
      )
    }

    await dbConnect()
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: new RegExp(`^${escapeRegex(identifier)}$`, 'i') }],
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account was found for that email or username.' },
        { status: 404 }
      )
    }

    const status =
      user.status || (user.role === 'admin' || user.verification === 'verified' ? 'Active' : 'Inactive')
    if (status === 'Active') {
      return NextResponse.json(
        { error: 'This account is already verified.' },
        { status: 400 }
      )
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex')
    user.resetTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24
    await user.save()

    await sendVerificationEmail({
      to: user.email,
      token: verificationToken,
      baseUrl: new URL(request.url).origin,
    })

    return NextResponse.json(
      { message: 'A new verification email has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to resend verification email.' },
      { status: 500 }
    )
  }
}
