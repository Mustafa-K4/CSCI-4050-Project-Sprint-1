import crypto from 'crypto'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { sendPasswordResetEmail } from '../../../../lib/auth/email'

const RESET_TOKEN_TTL_MINUTES = 15

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || '').toString().trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findOne({ email })

    const genericMessage = {
      message: 'If that email exists, a password reset link has been generated.',
    }

    if (!user) {
      return NextResponse.json(genericMessage, { status: 200 })
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
    const baseUrl = new URL(request.url).origin

    user.resetTokenHash = resetTokenHash
    user.resetTokenExpiresAt = expiresAt
    await user.save()

    try {
      await sendPasswordResetEmail({
        to: email,
        token: rawResetToken,
        baseUrl,
      })
    } catch (emailError) {
      user.resetTokenHash = null
      user.resetTokenExpiresAt = null
      await user.save()

      return NextResponse.json(
        { error: emailError.message || 'Unable to send password reset email.' },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          ...genericMessage,
          resetToken: rawResetToken,
          resetUrl: `${baseUrl}/reset-password?token=${rawResetToken}`,
          expiresAt,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(genericMessage, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to request password reset.' },
      { status: 500 }
    )
  }
}
