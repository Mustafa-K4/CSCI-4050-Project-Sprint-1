import bcrypt from 'bcryptjs'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const email = body.email && String(body.email).trim().toLowerCase()
    const password = body.password && String(body.password)

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'email and password are required' },
        { status: 400 },
      )
    }

    const user = await User.findOne({ email })
    if (!user) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    return Response.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error in login route:', error)
    return Response.json(
      {
        success: false,
        error: error.message || 'Login failed',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
