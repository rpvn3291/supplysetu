import { NextResponse } from 'next/server';

/**
 * GATEWAY ROUTE: PUT /api/orders/[id]/status
 * This route proxies the status update request to the Order Microservice.
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // 1. Get the Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Not authorized: Token missing' }, { status: 401 });
    }

    // 2. Parse the request body safely
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body provided' }, { status: 400 });
    }

    // 3. Ensure the Microservice URL is configured
    const ORDER_API_URL = process.env.ORDER_API_URL;
    if (!ORDER_API_URL) {
      console.error('Environment variable ORDER_API_URL is not defined in .env.local');
      return NextResponse.json({ message: 'Gateway configuration error' }, { status: 500 });
    }

    // 4. Forward the request to the Order Microservice
    const microserviceUrl = `${ORDER_API_URL}/api/orders/${id}/status`;
    
    const apiResponse = await fetch(microserviceUrl, {
      method: 'PUT',
      headers: { 
        'Authorization': authorization,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body),
    });

    // 5. Handle the response safely
    const contentType = apiResponse.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await apiResponse.json();
    } else {
      // If the microservice returned HTML (like a 404 or 500 server error), 
      // capture the text instead of crashing on .json()
      const text = await apiResponse.text();
      console.error(`Microservice returned non-JSON response from ${microserviceUrl}:`, text);
      return NextResponse.json(
        { message: 'Microservice Error', detail: `Server returned status ${apiResponse.status}` }, 
        { status: apiResponse.status || 500 }
      );
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Microservice failed to update order status' }, 
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Gateway Order Status Update Error:', error.message);
    return NextResponse.json(
      { message: 'Internal Gateway Error', error: error.message }, 
      { status: 500 }
    );
  }
}