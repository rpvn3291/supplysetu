// filename: app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');

  // --- REFACTORED: Fetches both products and the user's cart ---
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      // Fetch products (public)
      const productsRes = await fetch('/api/products');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const productsData = await productsRes.json();
      setProducts(productsData);

      // Fetch user's cart (private)
      if (token) {
        const cartRes = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cartRes.ok) throw new Error('Failed to fetch cart');
        const cartData = await cartRes.json();
        
        // We need to merge product details into the cart data
        const enrichedCart = cartData.map(cartItem => {
            const productDetails = productsData.find(p => p._id === cartItem.productId);
            return { ...cartItem, name: productDetails?.name, price: productDetails?.price };
        });
        setCart(enrichedCart);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- REFACTORED: Add to cart now calls the API ---
  const addToCart = async (product) => {
    setMessage(`Adding ${product.name} to cart...`);
    const token = localStorage.getItem('authToken');
    if (!token) return setMessage('Please log in to add items to your cart.');

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      if (!response.ok) throw new Error('Failed to add item');
      
      setMessage(`${product.name} added to cart!`);
      fetchData(); // Refresh cart from the server
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };
  
  // --- REFACTORED: handlePlaceOrder now clears the persistent cart on success ---
  const handlePlaceOrder = async () => {
    setMessage('Placing order...');
    const token = localStorage.getItem('authToken');
    if (!token || cart.length === 0) return;

    const orderData = {
      orderItems: cart.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
      totalPrice: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    };

    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData),
      });
      const newOrder = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(newOrder.message || 'Failed to place order');

      // On successful order, clear the persistent cart
      const clearCartResponse = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!clearCartResponse.ok) throw new Error('Failed to clear cart after order');

      setMessage(`Order placed successfully! Order ID: ${newOrder.id}`);
      fetchData(); // Refresh the (now empty) cart
    } catch (err) {
      setMessage(`Error placing order: ${err.message}`);
    }
  };
  
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);

  return (
    // ... your existing JSX for the page ...
    // The existing JSX will work perfectly with the new state logic.
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/login">&larr; Back to Login</Link>
      <h1>Available Products</h1>
      
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      <div style={{ border: '2px solid green', padding: '15px', marginBottom: '20px' }}>
        <h2>Shopping Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.productId}>
                {item.name} - ${item.price?.toFixed(2)} x {item.quantity}
              </div>
            ))}
            <hr />
            <p><strong>Total: ${cartTotal}</strong></p>
            <button onClick={handlePlaceOrder}>Place Order</button>
          </div>
        )}
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <div>
          {products.map((product) => (
            <div key={product._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p><strong>Price:</strong> ${product.price.toFixed(2)} per {product.unit}</p>
              <p><strong>Stock:</strong> {product.stock}</p>
              <button onClick={() => addToCart(product)}>Add to Cart</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

