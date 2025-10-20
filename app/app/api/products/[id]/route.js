// filename: app/api/products/[id]/route.js
import { NextResponse } from 'next/server';

// The 'params' object is automatically passed by Next.js for dynamic routes.
export async function GET(request, { params }) {
  try {
    const { id } = params; // Extract the product ID from the URL

    // 1. Forward the request to your deployed Product microservice.
    const apiResponse = await fetch(`${process.env.PRODUCT_API_URL}/api/products/${id}`, {
      cache: 'no-store',
    });

    const data = await apiResponse.json();

    // 2. Forward any errors from the microservice.
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch product details' }, { status: apiResponse.status });
    }

    // 3. If successful, forward the product data to the client.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`API Gateway GET product by ID error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

