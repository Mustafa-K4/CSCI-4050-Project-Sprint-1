import { cookies } from 'next/headers'
import dbConnect from '../../database/db'
import User from '../../models/user'
import { SESSION_COOKIE_NAME, verifySessionToken } from './session'

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = verifySessionToken(token)

  if (!session?.userId) {
    return null
  }

  await dbConnect()
  const user = await User.findById(session.userId)
  return user || null
}

export function toSafeUser(user) {
  if (!user) {
    return null
  }
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role || 'customer',
    address: Array.isArray(user.address) ? user.address : [],
    verification: user.verification,
  }
}
