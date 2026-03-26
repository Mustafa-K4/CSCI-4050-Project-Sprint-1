import crypto from 'crypto'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { hashPassword, validatePasswordStrength } from '../../../../lib/auth/passwords'

export async function POST(request) {
  try {
    const body = await request.json()
    const token = (body.token || '').toString()
    const newPassword = (body.newPassword || '').toString()
    const confirmPassword = (body.confirmPassword || '').toString()

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, new password, and confirmation are required.' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await dbConnect()
    const user = await User.findOne({
      resetTokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new reset link.' },
        { status: 400 }
      )
    }

    user.pswrd = await hashPassword(newPassword)
    user.resetTokenHash = null
    user.resetTokenExpiresAt = null
    await user.save()

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to reset password.' },
      { status: 500 }
    )
  }
}
