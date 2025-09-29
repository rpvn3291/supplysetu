// This server-side route acts as a gateway to your Order microservice's "myorders" endpoint.
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // 1. Get the auth token from the incoming client request headers.
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // 2. Forward the request to your deployed Order microservice.
    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/myorders`, {
      headers: {
        'Authorization': authorization, // Pass the token along
      },
      // Use cache: 'no-store' to ensure the latest orders are always fetched.
      cache: 'no-store',
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch orders' }, { status: apiResponse.status });
    }

    // 3. If successful, forward the order data back to the client.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway get my orders error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
