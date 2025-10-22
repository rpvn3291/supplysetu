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
  const [vendorProfile, setVendorProfile] = useState(null);

  // --- Fetches products, cart, and profile ---
  const fetchData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors on refetch
    const token = localStorage.getItem('authToken');
    try {
      // Fetch products first
      const productsRes = await fetch(`/api/products?search=${searchTerm}&page=${page}`);
      if (!productsRes.ok) {
          const errData = await productsRes.json();
          throw new Error(errData.message || 'Failed to fetch products');
      }
      const productsData = await productsRes.json();
      setProductsData(productsData);

      // Fetch user's cart and profile if logged in
      if (token) {
        const [cartRes, profileRes] = await Promise.all([
          fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!cartRes.ok) {
            const errData = await cartRes.json();
            throw new Error(errData.message || 'Failed to fetch cart');
        }
        const cartData = await cartRes.json();
        // Enrich cart needs product details. Use the list we just fetched.
        const enrichedCart = await enrichCart(cartData, productsData.products);
        setCart(enrichedCart);
        
        if (!profileRes.ok) {
            const errData = await profileRes.json();
            throw new Error(errData.message || 'Failed to fetch user profile');
        }
        const profileData = await profileRes.json();
        setVendorProfile(profileData);
      } else {
        // If not logged in, clear profile and cart
        setVendorProfile(null);
        setCart([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch Data Error:", err); // Log the specific fetch error
    } finally {
      setLoading(false);
    }
  };
  
  // --- Enriches cart with product details ---
  const enrichCart = async (cartData, allProducts) => {
    // This simplified version uses the already fetched products list.
    return cartData.map(item => {
      const productDetails = allProducts.find(p => p._id === item.productId);
      return { 
        ...item, 
        name: productDetails?.name || 'Product unavailable', 
        price: productDetails?.price || 0, 
        unit: productDetails?.unit || '' 
      };
    });
  }

  // --- Fetch data on load and when page/search changes ---
  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  // --- Add item to cart via API ---
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
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to add item');
      }
      setMessage(`${product.name} added to cart!`);
      fetchData(); // Refresh cart and product data
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error("Add to Cart Error:", err);
    }
  };
  
  // --- Place order via API with all required fields ---
  const handlePlaceOrder = async () => {
    setMessage('Placing order...');
    const token = localStorage.getItem('authToken');
    if (!token || cart.length === 0 || !vendorProfile || !vendorProfile.profile) {
        setMessage('Cannot place order. Ensure you are logged in and profile/cart is loaded.');
        console.error("Missing data for order:", {token, cartIsEmpty: cart.length === 0, vendorProfile});
        return;
    }
    
    // Find the product details for the first item to get supplierId
    const firstCartItemProduct = productsData.products.find(p => p._id === cart[0].productId);
    const supplierId = firstCartItemProduct?.supplierId;

    if (!supplierId) {
        setMessage('Error: Could not determine supplier ID for the items in the cart.');
        return;
    }
    if (vendorProfile.profile.latitude == null || vendorProfile.profile.longitude == null) {
        setMessage('Error: Vendor location (latitude/longitude) is missing from your profile.');
        return;
    }

    const orderData = {
      supplierId: supplierId,
      vendorLocationLat: vendorProfile.profile.latitude,
      vendorLocationLon: vendorProfile.profile.longitude,
      totalPrice: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      orderItems: cart.map(({ productId, quantity, price, unit }) => ({ 
          productId, 
          quantity, 
          price, 
          unitOfMeasure: unit || 'N/A' // Ensure unit is included
      })),
      // weatherAtOrder is added by the API Gateway
    };
    
    console.log("Sending Order Data:", orderData); // For debugging

    try {
      // Send the request to the API Gateway
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData),
      });
      
      const responseText = await orderResponse.text(); // Read response as text first for debugging
      console.log("Order Response Status:", orderResponse.status);
      console.log("Order Response Text:", responseText);

      // Attempt to parse only if the response is likely JSON
      let newOrder;
      try {
          newOrder = JSON.parse(responseText);
      } catch (parseError) {
          throw new Error(`Failed to parse order response: ${responseText}`);
      }

      if (!orderResponse.ok) {
        throw new Error(newOrder.message || responseText || 'Failed to place order');
      }

      // Clear the cart via API
      const clearCartResponse = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!clearCartResponse.ok) throw new Error('Failed to clear cart after order');

      setMessage(`Order placed successfully! Order ID: ${newOrder.id}`);
      fetchData(); // Refresh all data
    } catch (err) {
        console.error("Place Order Error:", err); // Log the full error
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
        <input 
          type="text" 
          name="search" 
          placeholder="Search for products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {/* Shopping Cart Display */}
      <div style={{ border: '2px solid green', padding: '15px', marginBottom: '20px' }}>
        <h2>Shopping Cart</h2>
        {cart.length === 0 ? <p>Your cart is empty.</p> : (
          <div>
            {cart.map(item => (
              <div key={item.productId}>{item.name} - ${item.price?.toFixed(2) || '0.00'} x {item.quantity}</div>
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

