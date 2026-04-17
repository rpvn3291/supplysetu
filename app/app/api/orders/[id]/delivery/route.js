import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Next.js 15+ needs await params
    const { id } = await params;
    const authorization = request.headers.get('authorization');

    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/${id}/delivery`, {
      headers: { 'Authorization': authorization },
      cache: 'no-store',
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch order delivery details' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Gateway Delivery Detail Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
