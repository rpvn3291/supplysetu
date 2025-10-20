// filename: app/api/auth/me/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // Forward the request to your deployed Auth microservice
    const apiResponse = await fetch(`${process.env.AUTH_API_URL}/api/auth/me`, {
      headers: { 'Authorization': authorization },
      cache: 'no-store',
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch user profile' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway "getMe" error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
