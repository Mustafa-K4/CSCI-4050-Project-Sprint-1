import { NextResponse } from 'next/server'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { toSafeUser } from '../../../../lib/auth/current-user'
import { hashPassword, isHashedPassword, verifyPassword } from '../../../../lib/auth/passwords'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '../../../../lib/auth/session'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const identifier = (body.identifier || '').toString().trim()
    const normalizedEmail = identifier.toLowerCase()
    const password = (body.password || '').toString()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required.' },
        { status: 400 }
      )
    }

    await dbConnect()
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: new RegExp(`^${escapeRegex(identifier)}$`, 'i') }],
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(password, user.pswrd)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    const status =
      user.status || (user.role === 'admin' || user.verification === 'verified' ? 'Active' : 'Inactive')
    if (status !== 'Active') {
      return NextResponse.json(
        {
          error: 'Account is not verified. Please check your email to verify your account.',
          code: 'ACCOUNT_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }

    if (!isHashedPassword(user.pswrd)) {
      user.pswrd = await hashPassword(password)
      await user.save()
    }

    const role = user.role === 'admin' ? 'admin' : 'customer'
    const token = createSessionToken({
      userId: user._id.toString(),
      role,
      email: user.email,
    })

    const response = NextResponse.json(
      {
        message: 'Login successful.',
        role,
        status,
        redirectTo: role === 'admin' ? '/admin' : '/',
        user: toSafeUser(user),
      },
      { status: 200 }
    )

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to process login.' },
      { status: 500 }
    )
  }
}
