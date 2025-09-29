// This server-side route acts as a gateway to your Order microservice.
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Get the auth token from the incoming client request headers.
    // FIX: Read the header directly from the 'request' object.
    const authorization = request.headers.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // 2. Get the order data from the request body.
    const body = await request.json();

    // 3. Forward the request to your deployed Order microservice,
    //    including the original authorization header.
    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization, // Pass the token along
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to create order' }, { status: apiResponse.status });
    }

    // 4. If successful, forward the new order data back to the client.
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('API Gateway create order error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

