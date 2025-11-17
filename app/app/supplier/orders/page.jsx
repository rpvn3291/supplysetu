// filename: app/supplier/orders/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Keep Link for potential internal links if needed

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function IncomingOrdersPage() {
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For feedback

    // --- Fetch Incoming Orders ---
    const fetchIncomingOrders = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('You must be logged in.');
            setLoading(false);
            return;
        }

        try {
            const ordersRes = await fetch('/api/orders/incoming', { headers: { 'Authorization': `Bearer ${token}` } });
            const ordersData = await ordersRes.json();
            if (!ordersRes.ok) throw new Error(ordersData.message || 'Failed to fetch incoming orders');

            // Optionally enrich with product names if needed (requires fetching products)
            // For now, just display IDs
            setIncomingOrders(ordersData);

        } catch (err) {
            setError(err.message);
            console.error("Fetch Incoming Orders Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncomingOrders();
    }, []);

    // Placeholder function for accepting/updating order status (implement later)
    const handleUpdateStatus = (orderItemId, newStatus) => {
        setMessage(`Action: Set status of item ${orderItemId.substring(0,6)}... to ${newStatus} (Not Implemented)`);
        console.log("Update status:", orderItemId, newStatus);
        // TODO: Call API Gateway -> Order Service PATCH endpoint
    };


    return (
        <div className="w-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Incoming Orders</h1>

            {message && <div className="p-3 mb-6 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">{message}</div>}
            {error && <div className="p-3 mb-6 rounded-lg text-sm font-medium bg-red-100 text-red-700">Error: {error}</div>}

            {loading && <p className="text-gray-500">Loading incoming orders...</p>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    {incomingOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No incoming orders for your products yet.</p>
                    ) : (
                        incomingOrders.map(item => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-gray-50 transition">
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-700">Product ID: {item.productId.substring(0, 12)}...</p>
                                    <p className="text-sm text-gray-600">Quantity: <span className="font-medium">{item.quantity}</span> {item.unitOfMeasure || ''}</p>
                                    <p className="text-sm text-gray-500">Price per unit: ₹{item.price.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400 mt-1">Order #{item.orderId.substring(0, 8)}... | Placed: {formatDate(item.order.createdAt)} | Status: <span className="font-medium">{item.order.status}</span></p>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                                     {item.order.status === 'PENDING' && (
                                         <button
                                             onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
                                             className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition whitespace-nowrap"
                                         >
                                             Confirm Order
                                         </button>
                                     )}
                                     {item.order.status === 'CONFIRMED' && (
                                          <button
                                             onClick={() => handleUpdateStatus(item.id, 'SHIPPED')}
                                             className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition whitespace-nowrap"
                                         >
                                             Mark as Shipped
                                         </button>
                                     )}
                                     {/* Add more status buttons as needed */}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}