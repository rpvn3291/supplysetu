// filename: app/my-orders/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Helper function to format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/orders/myorders', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store', // Always get fresh data
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch orders');
        }
        setOrders(data);
      } catch (err) {
        setError(err.message);
        console.error("Fetch My Orders Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // Fetch orders on initial load

  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/products" className="text-blue-600 hover:underline">
            &larr; Back to Products
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Orders</h1>
          {/* Optional: Add search or filter dropdowns here later */}
        </div>

        {/* Loading and Error States */}
        {loading && <p className="text-center text-gray-500 mt-10">Loading your orders...</p>}
        {error && <p className="text-center text-red-600 mt-10">Error: {error}</p>}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 mt-10 bg-white p-6 rounded-lg shadow">You haven't placed any orders yet.</p>
            ) : (
              orders.map((order) => (
                // Order Card
                <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold block sm:inline">ORDER PLACED</span><br className="sm:hidden"/> {formatDate(order.createdAt)}
                    </div>
                    <div>
                      <span className="font-semibold block sm:inline">TOTAL</span><br className="sm:hidden"/> ₹{order.totalPrice.toFixed(2)} {/* Assuming INR */}
                    </div>
                    <div>
                      <span className="font-semibold block sm:inline">SUPPLIER ID</span><br className="sm:hidden"/> {order.supplierId?.substring(0, 8) ?? 'N/A'}...
                    </div>
                    <div className="text-right">
                      <span className="font-semibold block sm:inline">ORDER #</span><br className="sm:hidden"/> {order.id.substring(0, 8)}...
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Status and Items */}
                    <div className="md:col-span-2">
                       <h2 className="text-lg font-semibold text-gray-800 mb-2">
                          Status: <span className={`font-bold ${order.status === 'DELIVERED' ? 'text-green-600' : 'text-orange-500'}`}>{order.status}</span>
                       </h2>
                       <p className="text-sm text-gray-500 mb-4">Estimated Delivery: {formatDate(order.estimatedDeliveryTime) || 'Not available'}</p>

                       <h3 className="text-md font-semibold text-gray-700 mb-2 border-t pt-3">Items Ordered:</h3>
                       <div className="space-y-2">
                         {order.orderItems.map(item => (
                           <div key={item.id} className="text-sm text-gray-600">
                             <span>{item.quantity} x (ID: {item.productId.substring(0, 8)}...) @ ₹{item.price.toFixed(2)} each [{item.unitOfMeasure}]</span>
                           </div>
                         ))}
                       </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="md:col-span-1 flex flex-col space-y-3">
                      <button className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition shadow-sm disabled:opacity-50" disabled>
                        Track Package (N/A)
                      </button>
                      <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition disabled:opacity-50" disabled>
                        Get Product Support (N/A)
                      </button>
                      {/* Link to a potential review page/modal */}
                      <Link href={`/reviews/new?orderId=${order.id}&supplierId=${order.supplierId}`} legacyBehavior>
                        <a className="w-full text-center px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-md hover:bg-yellow-500 transition shadow-sm">
                           Write a Product Review
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}