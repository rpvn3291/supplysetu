// This is a client component to fetch and display data in the browser.
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- NEW: State for the shopping cart and messaging ---
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch products when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Something went wrong');
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- NEW: Function to add a product to the cart ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.productId === product._id);
      if (existingItem) {
        // If item is already in cart, increase quantity
        return prevCart.map(item => 
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Otherwise, add new item to cart
      return [...prevCart, { productId: product._id, name: product.name, price: product.price, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart!`);
  };

  // --- NEW: Function to place the order ---
  const handlePlaceOrder = async () => {
    setMessage('Placing order...');
    const token = localStorage.getItem('authToken');

    if (!token) {
      setMessage('You must be logged in to place an order.');
      return;
    }

    if (cart.length === 0) {
      setMessage('Your cart is empty.');
      return;
    }

    const orderData = {
      orderItems: cart.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
      totalPrice: cart.reduce((total, item) => total + item.price * item.quantity, 0),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send the auth token
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to place order');
      
      setMessage(`Order placed successfully! Order ID: ${data.id}`);
      setCart([]); // Clear the cart after successful order

    } catch (err) {
      setMessage(`Error placing order: ${err.message}`);
    }
  };
  
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/login">&larr; Back to Login</Link>
      <h1>Available Products</h1>
      
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      {/* --- NEW: Shopping Cart Display --- */}
      <div style={{ border: '2px solid green', padding: '15px', marginBottom: '20px' }}>
        <h2>Shopping Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.productId}>
                {item.name} - ${item.price.toFixed(2)} x {item.quantity}
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
              {/* --- NEW: Add to Cart Button --- */}
              <button onClick={() => addToCart(product)}>Add to Cart</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

