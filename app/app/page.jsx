import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to the Street Food Supplier Hub</h1>
      <p>Your one-stop shop for connecting with suppliers and vendors.</p>
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link href="/login">
          Login or Register
        </Link>
        <Link href="/products">
          View Products (for Vendors)
        </Link>
        <Link href="/my-orders">
          View My Orders (for Vendors)
        </Link>
        <Link href="/supplier/dashboard">
          Supplier Dashboard
        </Link>
      </div>
    </div>
  );
}

