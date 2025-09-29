// filename: app/api/products/myproducts/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // Forward the request to your deployed Product microservice's "myproducts" endpoint
    const apiResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products/myproducts`, {
      headers: {
        'Authorization': authorization,
      },
      cache: 'no-store', // Ensures you always get the latest data
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch products' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway "myproducts" error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}