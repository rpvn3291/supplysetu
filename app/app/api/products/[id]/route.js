// This server-side route handles updating and deleting a specific product.
import { NextResponse } from 'next/server';

async function handleRequest(request, { params }) {
  const { id } = params;
  const method = request.method;
  const authorization = request.headers.get('authorization');
  
  if (!authorization) {
    return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
  }

  const url = `${process.env.PRODUCT_API_URL}/api/products/${id}`;
  const options = {
    method,
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json',
    },
  };
  
  if (method === 'PUT') {
    options.body = JSON.stringify(await request.json());
  }

  try {
    const apiResponse = await fetch(url, options);
    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || `Failed to ${method} product` }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    console.error(`API Gateway ${method} product error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export { handleRequest as PUT, handleRequest as DELETE };
