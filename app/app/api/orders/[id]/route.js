import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    // Forwarding to the Order Microservice
    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/${id}`, {
      headers: { 'Authorization': authorization },
      cache: 'no-store',
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch order' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Gateway Order Detail Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}