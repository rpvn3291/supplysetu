import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const authorization = request.headers.get('authorization');

    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/${id}/collect`, {
      method: 'PUT',
      headers: { 'Authorization': authorization },
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to collect order' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Gateway Collect Order Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
