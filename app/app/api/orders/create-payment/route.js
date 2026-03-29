import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const payload = await request.json();

    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to create payment intent' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway create-payment error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
