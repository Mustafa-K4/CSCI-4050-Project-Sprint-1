import dbConnect from '../../../database/db'
import User from '../../../models/user'
import { getSessionUser, toSafeUser } from '../../../lib/auth/current-user'
import { hashPassword, validatePasswordStrength } from '../../../lib/auth/passwords'
import { encryptPaymentData } from '../../../lib/security/encryption'
import { normalizePaymentCard, validatePaymentCard } from '../../../lib/security/payment-card'

function buildName(body) {
  const firstName = (body.firstName || '').toString().trim()
  const lastName = (body.lastName || '').toString().trim()
  const combinedName = `${firstName} ${lastName}`.trim()

  return combinedName || (body.name || '').toString().trim()
}

function normalizeSingleAddress(address) {
  if (Array.isArray(address)) {
    const firstAddress = address.map((item) => String(item || '').trim()).find(Boolean)
    return firstAddress ? [firstAddress] : []
  }

  const trimmedAddress = String(address || '').trim()
  return trimmedAddress ? [trimmedAddress] : []
}

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
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to create users.' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const body = await request.json()
    const name = buildName(body)
    const username = (body.username || '').toString().trim()
    const email = (body.email || '').toString().trim().toLowerCase()
    const password = (body.pswrd || '').toString()
    const role = body.role === 'admin' ? 'admin' : 'customer'
    const status =
      body.status === 'Active' || role === 'admin' || body.verification === 'verified'
        ? 'Active'
        : 'Inactive'

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
    const incomingPayments = Array.isArray(body.payments) ? body.payments.map(normalizePaymentCard) : []
    if (incomingPayments.length > 3) {
      return Response.json(
        { error: 'A user can store a maximum of 3 payment cards.' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const invalidPayment = incomingPayments
      .map((payment, index) => ({
        index,
        error: validatePaymentCard(payment),
      }))
      .find((result) => result.error)

    if (invalidPayment) {
      return Response.json(
        { error: `Payment card ${invalidPayment.index + 1}: ${invalidPayment.error}` },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const encryptedPayments = incomingPayments.map((payment) => encryptPaymentData(payment))

    const user = await User.create({
      name,
      firstName: (body.firstName || '').toString().trim(),
      lastName: (body.lastName || '').toString().trim(),
      username,
      pswrd: hashedPassword,
      role,
      status,
      email,
      address: normalizeSingleAddress(body.address),
      payments: encryptedPayments,
      no_payments:
        body.no_payments !== undefined && body.no_payments !== null
          ? String(body.no_payments)
          : String(encryptedPayments.length),
      verification: status === 'Active' ? 'verified' : (body.verification || 'unverified'),
      favorites: Array.isArray(body.favorites) ? body.favorites : [],
      promotionsOptIn: Boolean(body.promotionsOptIn),
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
