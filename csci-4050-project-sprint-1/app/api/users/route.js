import dbConnect from '../../../database/db'
import User from '../../../models/user'
import { getSessionUser, toSafeUser } from '../../../lib/auth/current-user'
import { hashPassword, validatePasswordStrength } from '../../../lib/auth/passwords'
import { encryptPaymentData } from '../../../lib/security/encryption'

export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to view users.' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    await dbConnect()

    const users = await User.find({}).select('-pswrd -resetTokenHash -resetTokenExpiresAt')

    return Response.json(users, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch users', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()

    const sessionUser = await getSessionUser()
    const body = await request.json()
    const name = (body.name || '').toString().trim()
    const username = (body.username || '').toString().trim()
    const email = (body.email || '').toString().trim().toLowerCase()
    const password = (body.pswrd || '').toString()
    const role = body.role === 'admin' ? 'admin' : 'customer'

    if (role === 'admin' && (!sessionUser || sessionUser.role !== 'admin')) {
      return Response.json(
        { error: 'Only admins can create admin users.' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!name || !username || !email || !password) {
      return Response.json(
        { error: 'name, username, email, and pswrd are required fields.' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return Response.json(
        { error: passwordError },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })
    if (existingUser) {
      return Response.json(
        { error: 'A user with that username or email already exists.' },
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const hashedPassword = await hashPassword(password)
    const incomingPayments = Array.isArray(body.payments) ? body.payments : []
    const encryptedPayments = incomingPayments.map((payment) => encryptPaymentData(payment))

    const user = await User.create({
      name,
      username,
      pswrd: hashedPassword,
      role,
      email,
      address: Array.isArray(body.address) ? body.address : [],
      payments: encryptedPayments,
      no_payments:
        body.no_payments !== undefined && body.no_payments !== null
          ? String(body.no_payments)
          : String(encryptedPayments.length),
      verification: body.verification || 'unverified',
      favorites: Array.isArray(body.favorites) ? body.favorites : [],
    })

    return Response.json(toSafeUser(user), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return Response.json(
      { error: error.message || 'Failed to create user', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
