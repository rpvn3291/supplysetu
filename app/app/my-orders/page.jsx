// This is a client component to fetch and display a user's order history.
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect runs once when the component mounts to fetch the orders.
  useEffect(() => {
    const fetchOrders = async () => {
      // Get the authentication token from local storage.
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }

      try {
        // Call our internal API gateway route for fetching orders.
        const response = await fetch('/api/orders/myorders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch orders');
        }

        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // The empty array ensures this runs only once.

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/products">&larr; Back to Products</Link>
      <h1>My Orders</h1>

      {loading && <p>Loading your orders...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && (
        <div>
          {orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
          ) : (
            orders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
                <h3>Order ID: {order.id}</h3>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Total Price:</strong> ${order.totalPrice.toFixed(2)}</p>
                <p><strong>Ordered On:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <h4>Items:</h4>
                <ul>
                  {order.orderItems.map(item => (
                    <li key={item.id}>
                      Product ID: {item.productId} - Quantity: {item.quantity} - Price: ${item.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
