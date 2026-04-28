import dbConnect from '../../../database/db';
import Promotion from '../../../models/promotion';

export async function GET(request) {
  try {
    await dbConnect();

    const promotions = await Promotion.find({});

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
    await dbConnect();

    const body = await request.json();

    const requiredFields = ['description', 'discountAmount', 'expirationDate', 'promoCode'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const promotion = new Promotion({
      description: body.description,
      discountAmount: body.discountAmount,
      expirationDate: body.expirationDate,
      promoCode: body.promoCode,
    });

    const savedPromotion = await promotion.save();

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
