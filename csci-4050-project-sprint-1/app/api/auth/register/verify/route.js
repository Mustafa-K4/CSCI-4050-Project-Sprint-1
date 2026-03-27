import dbConnect from '../../../../../database/db'
import User from '../../../../../models/user'

export async function GET(request) {
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return Response.json({ error: 'Invalid token' }, { status: 400 })
  }

  const user = await User.findOne({
    resetTokenHash: token,
    resetTokenExpiresAt: { $gt: Date.now() }
  })

  if (!user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  user.verification = 'verified'
  user.resetTokenHash = null
  user.resetTokenExpiresAt = null
  await user.save()

  return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`)
}
