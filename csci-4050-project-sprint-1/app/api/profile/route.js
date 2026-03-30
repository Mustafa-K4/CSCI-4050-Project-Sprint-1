import { NextResponse } from 'next/server'
import { getSessionUser, toSafeUser } from '../../../lib/auth/current-user'
import { sendProfileChangeEmail } from '../../../lib/auth/email'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    return NextResponse.json(toSafeUser(user), { status: 200 })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: error.message || 'Unable to load profile.' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const body = await request.json()
    const nextName = (body.name || '').toString().trim()
    const nextEmail = (body.email || '').toString().trim().toLowerCase()

    if (!nextName) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (nextEmail && nextEmail !== user.email) {
      return NextResponse.json({ error: 'Email address cannot be changed.' }, { status: 400 })
    }

    const changedFields = []
    if (user.name !== nextName) {
      user.name = nextName
      changedFields.push('name')
    }
    if (changedFields.length === 0) {
      return NextResponse.json({ error: 'No profile fields were changed.' }, { status: 400 })
    }

    await user.save()

    let emailWarning = ''
    try {
      await sendProfileChangeEmail({
        to: user.email,
        name: user.name,
        changedFields,
      })
    } catch (emailError) {
      emailWarning = emailError.message || 'Profile updated, but the email notification could not be sent.'
    }

    return NextResponse.json(
      {
        message: emailWarning || 'Profile updated successfully. Email notification sent.',
        user: toSafeUser(user),
        emailWarning,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to update profile.' },
      { status: 500 }
    )
  }
}
