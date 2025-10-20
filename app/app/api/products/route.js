// filename: app/api/products/route.js
import { NextResponse } from 'next/server';

// --- UPDATED: HANDLES GET /api/products with search and page parameters ---
export async function GET(request) {
  try {
    // 1. Get the search parameters from the incoming request's URL.
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';

    // 2. Construct the URL for the microservice, forwarding the parameters.
    const apiUrl = `${process.env.PRODUCT_API_URL}/api/products?search=${search}&page=${page}`;

    // 3. Fetch the product list from your deployed Product microservice.
    const apiResponse = await fetch(apiUrl, {
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

// --- POST handler remains unchanged ---
export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    const body = await request.json();

    const apiResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to create product' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('API Gateway POST product error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

