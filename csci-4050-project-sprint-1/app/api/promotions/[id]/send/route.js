import dbConnect from '../../../../../database/db';
import Promotion from '../../../../../models/promotion';
import User from '../../../../../models/user';
import { getSessionUser } from '../../../../../lib/auth/current-user';
import { sendPromotionEmail } from '../../../../../lib/auth/email';

export async function POST(_request, { params }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to send promotions.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return Response.json({ error: 'Promotion not found.' }, { status: 404 });
    }

    const expirationDate = new Date(promotion.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expirationDate < today) {
      return Response.json(
        { error: 'Expired promotions cannot be sent.' },
        { status: 400 }
      );
    }

    const subscribers = await User.find({
      promotionsOptIn: true,
      role: { $ne: 'admin' },
      status: 'Active',
      email: { $exists: true, $ne: '' },
    }).select('email');

    if (subscribers.length === 0) {
      return Response.json(
        { error: 'No active subscribed users were found.' },
        { status: 400 }
      );
    }

    const failures = [];
    let sentCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendPromotionEmail({
          to: subscriber.email,
          promotion,
        });
        sentCount += 1;
      } catch (sendError) {
        failures.push(subscriber.email);
        console.error(`Failed to send promotion to ${subscriber.email}:`, sendError);
      }
    }

    if (sentCount === 0) {
      return Response.json(
        { error: 'Promotion email could not be sent to any subscribed users.' },
        { status: 502 }
      );
    }

    promotion.sentAt = new Date();
    promotion.sentToCount = sentCount;
    await promotion.save();

    return Response.json(
      {
        promotion,
        sentCount,
        failedCount: failures.length,
      },
      { status: failures.length > 0 ? 207 : 200 }
    );
  } catch (error) {
    console.error('Error sending promotion:', error);
    return Response.json(
      { error: error.message || 'Failed to send promotion.' },
      { status: 500 }
    );
  }
}
