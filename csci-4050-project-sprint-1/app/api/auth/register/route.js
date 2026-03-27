import bcrypt from 'bcrypt'
import crypto from 'crypto'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'
import { sendVerificationEmail } from '../../../../lib/auth/email'

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const name = body.name?.trim()
    const username = body.username?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const confirmPassword = body.confirmPassword

    if (!name || !username || !email || !password || !confirmPassword) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return Response.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    await User.create({
      name,
      username,
      email,
      pswrd: hashedPassword,
      role: 'customer',
      verification: 'unverified',
      resetTokenHash: verificationToken,
      resetTokenExpiresAt: Date.now() + 1000 * 60 * 60 * 24
    })

    await sendVerificationEmail({
      to: email,
      token: verificationToken
    })

    return Response.json(
      { success: true, message: 'Registration successful. Check your email to verify your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
