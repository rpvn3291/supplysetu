// This is a server-side file.
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Get the full registration body from the client.
    const body = await request.json();

    // 2. Call the actual auth microservice.
    const apiResponse = await fetch(`${process.env.AUTH_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    // 3. Forward any errors.
    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Registration failed' }, { status: apiResponse.status });
    }

    // 4. Forward the successful response.
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('API Gateway register error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
