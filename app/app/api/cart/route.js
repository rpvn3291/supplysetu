// filename: app/api/cart/route.js
import { NextResponse } from 'next/server';

// --- GET /api/cart ---
export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const apiResponse = await fetch(`${process.env.CART_API_URL}/api/cart`, {
      headers: { 'Authorization': authorization },
      cache: 'no-store',
    });
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST /api/cart ---
export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const body = await request.json();
    const apiResponse = await fetch(`${process.env.CART_API_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authorization },
      body: JSON.stringify(body),
    });
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE /api/cart ---
export async function DELETE(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const apiResponse = await fetch(`${process.env.CART_API_URL}/api/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': authorization },
    });
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
