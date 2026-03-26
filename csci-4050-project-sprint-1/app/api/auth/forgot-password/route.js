import crypto from 'crypto'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'

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

    user.resetTokenHash = resetTokenHash
    user.resetTokenExpiresAt = expiresAt
    await user.save()

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          ...genericMessage,
          resetToken: rawResetToken,
          resetUrl: `/reset-password?token=${rawResetToken}`,
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
