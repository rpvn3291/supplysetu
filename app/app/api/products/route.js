// filename: app/api/products/route.js
import { NextResponse } from 'next/server';

// --- HANDLES GET /api/products (to fetch all products) ---
export async function GET() {
  try {
    const apiResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products`, {
      cache: 'no-store',
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch products' }, { status: apiResponse.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Gateway GET products error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- NEW: HANDLES POST /api/products (to create a new product) ---
export async function POST(request) {
  try {
    // 1. Get the auth token from the client's request.
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    // 2. Get the new product data from the request body.
    const body = await request.json();

    // 3. Forward the request to the deployed Product microservice.
    const apiResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization, // Pass the token along
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    // 4. Forward the response (success or error) back to the client.
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to create product' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('API Gateway POST product error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

