import bcrypt from 'bcryptjs'
import dbConnect from '../../../../database/db'
import User from '../../../../models/user'

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const name = body.name && String(body.name).trim()
    const email = body.email && String(body.email).trim().toLowerCase()
    const password = body.password && String(body.password)
    const role = body.role && String(body.role).toLowerCase() === 'admin' ? 'admin' : 'user'

    if (!name || !email || !password) {
      return Response.json({ error: 'name, email, and password are required' }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    })

    return Response.json(
      {
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error in register route:', error)
    const isDup = error && error.code === 11000
    return Response.json(
      {
        success: false,
        error: isDup ? 'Email already in use' : error.message || 'Registration failed',
      },
      {
        status: isDup ? 409 : 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
