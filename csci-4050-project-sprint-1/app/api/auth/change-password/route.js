import { NextResponse } from 'next/server'
import { getSessionUser } from '../../../../lib/auth/current-user'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../../../../lib/auth/passwords'

export async function POST(request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = (body.currentPassword || '').toString()
    const newPassword = (body.newPassword || '').toString()
    const confirmPassword = (body.confirmPassword || '').toString()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirmation are required.' },
        { status: 400 }
      )
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.pswrd)
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 })
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password.' },
        { status: 400 }
      )
    }

    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    user.pswrd = await hashPassword(newPassword)
    await user.save()

    return NextResponse.json({ message: 'Password changed successfully.' }, { status: 200 })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to change password.' },
      { status: 500 }
    )
  }
}
