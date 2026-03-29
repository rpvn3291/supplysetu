import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    
    // Using Next.js 15+ promise resolution for route params if needed, but in 14 it's direct.
    // However, it's safer to await params if it's dynamic in nextjs 15:
    // const resolvedParams = await params;
    // const userId = resolvedParams.userId;

    const apiResponse = await fetch(`${process.env.REVIEWS_API_URL}/api/reviews/user/${userId}`, {
      cache: 'no-store',
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
        return NextResponse.json({ message: data.message || 'Failed to fetch reviews' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Gateway get user reviews error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
