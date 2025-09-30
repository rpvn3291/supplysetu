// filename: app/api/orders/incoming/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // 1. Get the auth token from the client's request.
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // 2. Forward the request to the deployed Order microservice.
    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/incoming`, {
      headers: {
        'Authorization': authorization, // Pass the token along
      },
      cache: 'no-store', // Always get the latest orders
    });

    const data = await apiResponse.json();

    // 3. Forward the response (success or error) back to the client.
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch incoming orders' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway "incoming orders" error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
