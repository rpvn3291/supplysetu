import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const body = await request.json();

    const apiResponse = await fetch(`${process.env.REVIEWS_API_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
        return NextResponse.json({ message: data.message || 'Failed to submit review' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API Gateway submit review error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
