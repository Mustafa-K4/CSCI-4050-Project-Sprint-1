import crypto from 'crypto'
import dbConnect from '../../../../../database/db'
import User from '../../../../../models/user'

export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin

  await dbConnect()

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return Response.redirect(`${baseUrl}/verified?status=invalid`)
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: Date.now() }
  })

  if (!user) {
    return Response.redirect(`${baseUrl}/verified?status=invalid`)
  }

  user.status = 'Active'
  user.verification = 'verified'
  user.resetTokenHash = null
  user.resetTokenExpiresAt = null
  await user.save()

  return Response.redirect(`${baseUrl}/verified?status=success`)
}
