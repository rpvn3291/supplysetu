// This is a server-side file. It runs on the Next.js server, not in the browser.
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Get the email and password from the incoming request from the client.
    const body = await request.json();
    const { email, password } = body;

    // 2. Call the actual auth microservice.
    const apiResponse = await fetch(`${process.env.AUTH_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await apiResponse.json();

    // 3. Check if the microservice returned an error.
    if (!apiResponse.ok) {
      // Forward the error from the microservice to the client.
      return NextResponse.json({ message: data.message || 'Authentication failed' }, { status: apiResponse.status });
    }

    // 4. If successful, forward the successful response to the client.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API Gateway login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
