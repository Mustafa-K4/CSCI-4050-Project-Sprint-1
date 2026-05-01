import dbConnect from '../../../database/db';
import Promotion from '../../../models/promotion';
import { getSessionUser } from '../../../lib/auth/current-user';

function buildPromotionPayload(body) {
  return {
    description: String(body.description || '').trim(),
    discountAmount: Number(body.discountAmount),
    expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
    promoCode: String(body.promoCode || '').trim().toUpperCase(),
  };
}

function validatePromotionPayload(payload) {
  if (!payload.description) {
    return 'Promotion description is required.';
  }

  if (!payload.promoCode) {
    return 'Promotion code is required.';
  }

  if (!/^[A-Z0-9_-]{3,24}$/.test(payload.promoCode)) {
    return 'Promotion code must be 3-24 characters using letters, numbers, dashes, or underscores.';
  }

  if (!Number.isFinite(payload.discountAmount) || payload.discountAmount <= 0) {
    return 'Discount amount must be greater than 0.';
  }

  if (!payload.expirationDate || Number.isNaN(payload.expirationDate.getTime())) {
    return 'Expiration date is required.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (payload.expirationDate < today) {
    return 'Expiration date cannot be in the past.';
  }

  return '';
}

export async function GET(request) {
  try {
    await dbConnect();

    const promotions = await Promotion.find({}).sort({ createdAt: -1, expirationDate: 1 });

    return Response.json(promotions, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch promotions', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden. Admin privileges are required to add promotions.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const payload = buildPromotionPayload(body);
    const validationError = validatePromotionPayload(payload);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const existingPromotion = await Promotion.findOne({ promoCode: payload.promoCode });
    if (existingPromotion) {
      return Response.json(
        { error: 'A promotion with this code already exists.' },
        { status: 409 }
      );
    }

    const savedPromotion = await Promotion.create(payload);

    return Response.json(savedPromotion, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return Response.json(
      { error: error.message || 'Failed to create promotion', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
