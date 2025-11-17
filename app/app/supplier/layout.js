// filename: app/supplier/layout.js
import Link from 'next/link';

// Basic Sidebar Navigation Component
const SupplierNav = () => (
    <nav className="w-full md:w-48 bg-gray-800 text-white p-4 flex flex-col space-y-3 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-600">Supplier Menu</h2>
        <Link href="/supplier/products" className="hover:bg-gray-700 p-2 rounded">Manage Products</Link>
        <Link href="/supplier/orders" className="hover:bg-gray-700 p-2 rounded">Incoming Orders</Link>
        <Link href="/markets" className="hover:bg-gray-700 p-2 rounded">Live Markets</Link>
        {/* Add links to Reviews, Settings later */}
        <hr className="border-gray-600 my-2"/>
        <Link href="/" className="text-sm hover:bg-gray-700 p-2 rounded">&larr; Back to Home</Link>
    </nav>
);

export default function SupplierLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 font-inter">
      <SupplierNav />
      <main className="flex-grow p-4 sm:p-8 overflow-auto">
        {/* The content of the specific supplier page will be rendered here */}
        {children}
      </main>
    </div>
  );
}