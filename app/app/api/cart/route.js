import { NextResponse } from 'next/server';

function getCartBaseUrl() {
  const raw = process.env.CART_API_URL;
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

async function readJsonOrText(response) {
  const text = await response.text();
  if (!text) return { data: null, isJson: false, text: '' };
  try {
    return { data: JSON.parse(text), isJson: true, text };
  } catch {
    return { data: text, isJson: false, text };
  }
}

// --- GET /api/cart ---
export async function GET(request) {
  try {
    const cartBaseUrl = getCartBaseUrl();
    if (!cartBaseUrl) {
      return NextResponse.json({ message: 'CART_API_URL is not set' }, { status: 500 });
    }

    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const apiResponse = await fetch(`${cartBaseUrl}/api/cart`, {
      headers: { 'Authorization': authorization },
      cache: 'no-store',
    });

    const { data, isJson, text } = await readJsonOrText(apiResponse);
    if (!apiResponse.ok) {
      const message =
        (isJson && data && typeof data === 'object' && 'message' in data && data.message) ||
        (typeof data === 'string' && data) ||
        text ||
        apiResponse.statusText ||
        'Failed to fetch cart';
      return NextResponse.json({ message }, { status: apiResponse.status });
    }

    if (!isJson) {
      return NextResponse.json({ message: 'Upstream cart service returned non-JSON response' }, { status: 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Gateway cart GET error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { message: 'Internal Server Error', ...(isDev ? { details: String(error?.message || error) } : {}) },
      { status: 500 }
    );
  }
}

// --- POST /api/cart ---
export async function POST(request) {
  try {
    const cartBaseUrl = getCartBaseUrl();
    if (!cartBaseUrl) {
      return NextResponse.json({ message: 'CART_API_URL is not set' }, { status: 500 });
    }

    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const body = await request.json();
    const apiResponse = await fetch(`${cartBaseUrl}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authorization },
      body: JSON.stringify(body),
    });

    const { data, isJson, text } = await readJsonOrText(apiResponse);
    if (!apiResponse.ok) {
      const message =
        (isJson && data && typeof data === 'object' && 'message' in data && data.message) ||
        (typeof data === 'string' && data) ||
        text ||
        apiResponse.statusText ||
        'Failed to update cart';
      return NextResponse.json({ message }, { status: apiResponse.status });
    }

    if (!isJson) {
      return NextResponse.json({ message: 'Upstream cart service returned non-JSON response' }, { status: 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Gateway cart POST error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { message: 'Internal Server Error', ...(isDev ? { details: String(error?.message || error) } : {}) },
      { status: 500 }
    );
  }
}

// --- DELETE /api/cart ---
export async function DELETE(request) {
  try {
    const cartBaseUrl = getCartBaseUrl();
    if (!cartBaseUrl) {
      return NextResponse.json({ message: 'CART_API_URL is not set' }, { status: 500 });
    }

    const authorization = request.headers.get('authorization');
    if (!authorization) return NextResponse.json({ message: 'Auth header missing' }, { status: 401 });

    const apiResponse = await fetch(`${cartBaseUrl}/api/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': authorization },
    });

    const { data, isJson, text } = await readJsonOrText(apiResponse);
    if (!apiResponse.ok) {
      const message =
        (isJson && data && typeof data === 'object' && 'message' in data && data.message) ||
        (typeof data === 'string' && data) ||
        text ||
        apiResponse.statusText ||
        'Failed to clear cart';
      return NextResponse.json({ message }, { status: apiResponse.status });
    }

    if (!isJson) {
      return NextResponse.json({ message: 'Upstream cart service returned non-JSON response' }, { status: 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Gateway cart DELETE error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { message: 'Internal Server Error', ...(isDev ? { details: String(error?.message || error) } : {}) },
      { status: 500 }
    );
  }
}
