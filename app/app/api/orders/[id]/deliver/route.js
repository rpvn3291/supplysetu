import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const authorization = request.headers.get('authorization');
    
    // Pass the OTP body
    const reqBody = await request.text();

    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders/${id}/deliver`, {
      method: 'PUT',
      headers: { 
        'Authorization': authorization,
        'Content-Type': 'application/json' 
      },
      body: reqBody
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to deliver order' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Gateway Deliver Order Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
