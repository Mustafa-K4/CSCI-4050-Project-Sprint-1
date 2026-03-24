import dbConnect from '../../../database/db';
import User from '../../../models/user';

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({});

    return Response.json(users, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch users', details: error.toString() },
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
    const user = await User.create({
      name: body.name,
      username: body.username,
      pswrd: body.pswrd,
      email: body.email,
      address: Array.isArray(body.address) ? body.address : [],
      payments: Array.isArray(body.payments) ? body.payments : [],
      no_payments:
        body.no_payments !== undefined && body.no_payments !== null
          ? String(body.no_payments)
          : String(Array.isArray(body.payments) ? body.payments.length : 0),
      verification: body.verification || 'unverified',
      favorites: Array.isArray(body.favorites) ? body.favorites : [],
    });

    return Response.json(user, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json(
      { error: error.message || 'Failed to create user', details: error.toString() },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
