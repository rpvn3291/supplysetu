'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * SUPPLY SETU - SUPPLIER INCOMING ORDERS
 * This page allows the Supplier to view and manage orders placed by Vendors.
 */

export default function IncomingOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null); // Tracks which order is updating

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setError("No authentication token found. Please log in as a Supplier.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders/incoming', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch incoming orders');
      }
      
      // Ensure data is an array
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusLoading(orderId);
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Refresh local state immediately for better UX
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        const errData = await res.json();
        alert(`Failed to update status: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Update Status Error:", err);
      alert("Network error while updating status.");
    } finally {
      setStatusLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 animate-pulse">Loading incoming orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incoming Orders</h1>
            <p className="text-gray-500 mt-1">Manage requests from your street food vendors</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl flex justify-between items-center">
            <span>{error}</span>
            <Link href="/login" className="text-sm font-bold underline">Login</Link>
          </div>
        )}

        <div className="space-y-6">
          {orders.length === 0 && !error ? (
            <div className="bg-white p-20 rounded-2xl text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400">No incoming orders found. Ask a vendor to place an order!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-5 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-mono text-sm font-bold">
                      #{order.id.substring(0, 8).toUpperCase()}
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      Placed: {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {order.status}
                    </div>
                    
                    {/* Actions */}
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        disabled={statusLoading === order.id}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                      >
                        {statusLoading === order.id ? 'Updating...' : 'Accept Order'}
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                        disabled={statusLoading === order.id}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                      >
                        {statusLoading === order.id ? 'Updating...' : 'Mark Shipped'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-5 bg-gray-50/30">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                    Ordered Items
                  </span>
                  <div className="space-y-2">
                    {order.orderItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700 font-medium">
                          Product ID: {item.productId.substring(0, 10)}... 
                          <span className="text-gray-400 ml-2">x {item.quantity}</span>
                        </span>
                        <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-white flex justify-between items-center border-t border-gray-50">
                  <span className="text-sm text-gray-500 font-medium">Vendor ID: {order.vendorId.substring(0, 6)}</span>
                  <div className="text-lg font-bold text-gray-900">
                    Total: <span className="text-green-600">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}