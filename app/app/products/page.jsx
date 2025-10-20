// filename: app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProductsPage() {
  const [productsData, setProductsData] = useState({ products: [], page: 1, pages: 1 });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // --- REFACTORED: This function now only fetches the cart and enriches it independently ---
  const fetchCart = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCart([]); // Not logged in, cart is empty
      return;
    }
    try {
      const cartRes = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!cartRes.ok) throw new Error('Failed to fetch cart');
      const cartData = await cartRes.json(); // This is the basic cart [{ productId, quantity }]

      if (cartData.length === 0) {
        setCart([]);
        return;
      }

      // For each item in the cart, fetch its full details to get name and price
      const enrichedCartPromises = cartData.map(async (item) => {
        const productRes = await fetch(`/api/products/${item.productId}`);
        if (!productRes.ok) {
          console.warn(`Could not fetch details for product ID: ${item.productId}`);
          return { ...item, name: 'Product not available', price: 0 };
        }
        const productDetails = await productRes.json();
        return { ...item, name: productDetails.name, price: productDetails.price };
      });

      const enrichedCart = await Promise.all(enrichedCartPromises);
      setCart(enrichedCart);
    } catch (err) {
      // Don't set the main page error, just log it for debugging
      console.error("Failed to fetch or enrich cart:", err.message);
    }
  };
  
  // This useEffect fetches the main list of products based on search and page
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRes = await fetch(`/api/products?search=${searchTerm}&page=${page}`);
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const data = await productsRes.json();
        setProductsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, searchTerm]);

  // This useEffect fetches the cart details on initial page load
  useEffect(() => {
    fetchCart();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const addToCart = async (product) => {
    setMessage(`Adding ${product.name} to cart...`);
    const token = localStorage.getItem('authToken');
    if (!token) return setMessage('Please log in to add items to your cart.');
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      if (!response.ok) throw new Error('Failed to add item');
      setMessage(`${product.name} added to cart!`);
      fetchCart(); // --- FIX: Only refresh the cart, not the whole page data
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };
  
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
      const clearCartResponse = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!clearCartResponse.ok) throw new Error('Failed to clear cart');
      setMessage(`Order placed successfully! Order ID: ${newOrder.id}`);
      fetchCart(); // --- FIX: Only refresh the cart
    } catch (err) {
      setMessage(`Error placing order: ${err.message}`);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/">&larr; Back to Home</Link>
      <h1>Available Products</h1>
      
      {message && <p style={{ color: 'blue' }}>{message}</p>}
      
      <form onSubmit={handleSearchSubmit} style={{ margin: '20px 0' }}>
        <input type="text" name="search" placeholder="Search for products..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      {/* Shopping Cart Display */}
      <div style={{ border: '2px solid green', padding: '15px', marginBottom: '20px' }}>
        <h2>Shopping Cart</h2>
        {cart.length === 0 ? <p>Your cart is empty.</p> : (
          <div>
            {cart.map(item => (
              <div key={item.productId}>{item.name} - ${item.price?.toFixed(2) || 'N/A'} x {item.quantity}</div>
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
          {productsData.products.length === 0 ? <p>No products found.</p> : (
            productsData.products.map((product) => (
              <div key={product._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                <h2><Link href={`/products/${product._id}`}>{product.name}</Link></h2>
                <p>{product.description}</p>
                <p><strong>Price:</strong> ${product.price.toFixed(2)} per {product.unit}</p>
                <button onClick={() => addToCart(product)}>Add to Cart</button>
              </div>
            ))
          )}
          {/* Pagination Controls */}
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setPage(p => p - 1)} disabled={productsData.page <= 1}>Previous</button>
            <span style={{ margin: '0 10px' }}>Page {productsData.page} of {productsData.pages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={productsData.page >= productsData.pages}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

