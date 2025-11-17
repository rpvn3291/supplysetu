// filename: app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Icons (Inline SVGs) ---
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
);
const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
);
const VerifiedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
// --- End Icons ---


export default function ProductsPage() {
  const [productsData, setProductsData] = useState({ products: [], page: 1, pages: 1 });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- Main data fetching function ---
  const fetchData = async () => {
    setLoading(true);
    setLoadingCart(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    let fetchedProducts = [];
    try {
      // Fetch products
      const productsRes = await fetch(`/api/products?search=${searchTerm}&page=${page}`);
      if (!productsRes.ok) {
          const errData = await productsRes.json();
          throw new Error(errData.message || 'Failed to fetch products');
      }
      const productsResult = await productsRes.json();
      setProductsData(productsResult);
      fetchedProducts = productsResult.products || [];
      setLoading(false);

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
        const enrichedCart = await enrichCart(cartData, fetchedProducts);
        setCart(enrichedCart);

        if (!profileRes.ok) {
            const errData = await profileRes.json();
            console.error('Failed to fetch user profile:', errData.message);
        } else {
             const profileData = await profileRes.json();
             setVendorProfile(profileData);
        }
      } else {
        setVendorProfile(null);
        setCart([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
      setLoadingCart(false);
    }
  };
  
  // --- Fetches JUST the cart ---
  const fetchCartOnly = async () => {
      setLoadingCart(true);
      const token = localStorage.getItem('authToken');
      if (!token) { setCart([]); setLoadingCart(false); return; }
      try {
           const cartRes = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } });
           if (!cartRes.ok) { throw new Error('Failed to fetch cart'); }
           const cartData = await cartRes.json();
           const enrichedCart = await enrichCart(cartData, productsData.products);
           setCart(enrichedCart);
      } catch (err) {
           console.error("Fetch Cart Error:", err);
      } finally {
          setLoadingCart(false);
      }
  };

  // --- Enriches cart with product details ---
   const enrichCart = async (cartData, allProducts) => {
    const enrichedCartPromises = cartData.map(async (item) => {
        let productDetails = allProducts.find(p => p._id === item.productId);
        if (!productDetails && item.productId) {
            try {
                const productRes = await fetch(`/api/products/${item.productId}`);
                if (productRes.ok) productDetails = await productRes.json();
            } catch (fetchErr) {
                console.error(`Error fetching details for cart item ${item.productId}:`, fetchErr);
            }
        }
        return { ...item, name: productDetails?.name || 'Product unavailable', price: productDetails?.price || 0, unit: productDetails?.unit || '' };
    });
    return Promise.all(enrichedCartPromises);
  }

  // Fetch data on load and when page/search changes
  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  // --- Event Handlers ---
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
    setMessage('');
    setError(null);
  };

  const addToCart = async (product) => {
    setMessage(`Adding ${product.name}...`);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) return setMessage('Please log in to add items.');
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
      setMessage(`${product.name} added!`);
      await fetchCartOnly(); // Only refresh cart
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error("Add to Cart Error:", err);
    }
  };

  const updateCartQuantity = async (productId, change) => {
      setMessage('Updating cart...'); setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
          const response = await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ productId: productId, quantity: change }),
          });
          if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed'); }
          await fetchCartOnly(); // Refresh cart
          setMessage('Cart updated.');
      } catch(err) {
          setMessage(`Error updating quantity: ${err.message}`);
          console.error("Update Qty Error:", err);
      }
  };

   const removeFromCart = async (productId) => {
       setMessage('Removing item...'); setError(null);
       const token = localStorage.getItem('authToken');
       if (!token) return;
       try {
           const response = await fetch(`/api/cart/${productId}`, {
               method: 'DELETE',
               headers: { 'Authorization': `Bearer ${token}` },
           });
           if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed'); }
           setMessage('Item removed.');
           await fetchCartOnly(); // Refresh cart
       } catch (err) {
           setMessage(`Error removing item: ${err.message}`);
           console.error("Remove Item Error:", err);
       }
   };

  const handlePlaceOrder = async () => {
    setMessage('Placing order...');
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token || cart.length === 0 || !vendorProfile || !vendorProfile.profile) {
        setMessage('Cannot place order. Ensure you are logged in, profile loaded, and cart not empty.');
        return;
    }
    
    let supplierId;
    let firstProductDetails = productsData.products.find(p => p._id === cart[0].productId);
     if (!firstProductDetails) {
         try {
             const res = await fetch(`/api/products/${cart[0].productId}`);
             if(res.ok) firstProductDetails = await res.json();
         } catch(e){ console.error("Could not fetch product details for supplierId check"); }
     }
    supplierId = firstProductDetails?.supplierId;

    if (!supplierId) {
        setMessage('Error: Could not determine supplier ID. All items in one order must be from the same supplier.');
        return;
    }
    if (vendorProfile.profile.latitude == null || vendorProfile.profile.longitude == null) {
        setMessage('Error: Vendor location (latitude/longitude) is missing from profile.');
        return;
    }

    const orderData = {
      supplierId: supplierId,
      vendorLocationLat: vendorProfile.profile.latitude,
      vendorLocationLon: vendorProfile.profile.longitude,
      totalPrice: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      orderItems: cart.map(({ productId, quantity, price, unit }) => ({
          productId, quantity, price: price || 0, unitOfMeasure: unit || 'N/A'
      })),
      // weatherAtOrder is added by the API Gateway
    };

    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData),
      });

      const responseText = await orderResponse.text();
      let newOrder;
      try { newOrder = JSON.parse(responseText); }
      catch (parseError) { throw new Error(`Failed to parse order response: ${responseText}`); }

      if (!orderResponse.ok) throw new Error(newOrder.message || responseText || 'Failed to place order');

      const clearCartResponse = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!clearCartResponse.ok) throw new Error('Failed to clear cart after order');

      setMessage(`Order placed successfully! Order ID: ${newOrder.id}`);
      setCart([]); // Immediately clear local cart
      setIsCartOpen(false); // Close cart drawer
    } catch (err) {
        console.error("Place Order Error:", err);
        setMessage(`Error placing order: ${err.message}`);
    }
  };

  const handleClearCart = async () => {
      setMessage('Clearing cart...');
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) return setMessage('Authentication token not found.');
      try {
          const response = await fetch('/api/cart', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.message || 'Failed to clear cart');
          }
          setMessage('Cart cleared successfully.');
          setCart([]); // Immediately update UI
          setIsCartOpen(false);
      } catch (err) {
          setMessage(`Error clearing cart: ${err.message}`);
          console.error("Clear Cart Error:", err);
      }
  };

  const cartTotal = cart.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0).toFixed(2);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Header Bar */}
      <header className="bg-white shadow-md sticky top-0 z-10 py-3 px-4">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link href="/" className="text-lg font-semibold text-gray-700 hover:text-green-600 whitespace-nowrap">
                  &larr; Back to Home
              </Link>
              <div className="w-full sm:w-auto flex-grow max-w-xl">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                      <input type="text" name="search" placeholder="Search available products..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition shadow whitespace-nowrap"> Search </button>
                  </form>
              </div>
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition whitespace-nowrap" aria-label="Open Shopping Cart">
                  <CartIcon />
                  {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{cartItemCount}</span>
                  )}
              </button>
          </div>
           {!loading && !error && productsData.pages > 1 && (
              <div className="container mx-auto flex justify-center items-center mt-3 space-x-3 text-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={productsData.page <= 1} className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"> Previous </button>
                <span className="text-gray-600"> Page {productsData.page} of {productsData.pages} </span>
                <button onClick={() => setPage(p => Math.min(productsData.pages, p + 1))} disabled={productsData.page >= productsData.pages} className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"> Next </button>
              </div>
            )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {message && <p className="text-center text-blue-600 mb-4">{message}</p>}
        {error && <p className="text-center text-red-600 mb-4">Error: {error}</p>}

        {loading && <p className="text-center text-gray-500 mt-10">Loading products...</p>}
        {!loading && !error && (
          <div>
            {productsData.products.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">No products found matching your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productsData.products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200 hover:shadow-xl transition duration-300">
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 overflow-hidden">
                      {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e)=>{e.target.onerror = null; e.target.src="https://placehold.co/300x200/eee/ccc?text=Image+Missing"}}/>
                      ) : (
                           <span className="text-xs text-gray-500">Image Not Available</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      {/* --- NEW: Trust Signals --- */}
                      <div className="flex justify-between items-center mb-2">
                        {product.isVerified ? (
                          <span className="flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <VerifiedIcon /> Verified Supplier
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                            Unverified
                          </span>
                        )}
                        <span className="flex items-center text-xs font-medium text-gray-600">
                            <StarIcon />
                            {product.qualityRating > 0 ? product.qualityRating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      
                      <h2 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                        <Link href={`/products/${product._id}`} className="hover:text-green-600">{product.name}</Link>
                      </h2>
                      <p className="text-xs text-gray-500 mb-2">by {product.supplierName}</p>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">{product.description}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-bold text-green-700">₹{(product.price || 0).toFixed(2)}</span>
                        <span className="text-xs text-gray-500">per {product.unit}</span>
                      </div>
                      
                      <button onClick={() => addToCart(product)} className="w-full mt-auto bg-amber-500 text-white py-2 rounded-md font-semibold hover:bg-amber-600 transition shadow">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Shopping Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"> <CloseIcon /> </button>
          </div>
          {/* Cart Items */}
          <div className="p-4 overflow-y-auto h-[calc(100%-190px)]">
              {loadingCart && <p className="text-center text-gray-500">Loading cart...</p>}
              {!loadingCart && cart.length === 0 && ( <p className="text-center text-gray-500 mt-10">Your cart is empty.</p> )}
              {!loadingCart && cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                          <p className="font-medium text-gray-700 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">₹{(item.price || 0).toFixed(2)} ea.</p>
                          <div className="flex items-center mt-2">
                              <button onClick={() => updateCartQuantity(item.productId, -1)} className="p-1 border rounded text-gray-600 hover:bg-gray-200"><MinusIcon /></button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.productId, 1)} className="p-1 border rounded text-gray-600 hover:bg-gray-200"><PlusIcon /></button>
                              <button onClick={() => removeFromCart(item.productId)} className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                          </div>
                      </div>
                      <p className="font-semibold text-gray-800">₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
              ))}
          </div>
          {/* Cart Footer */}
          {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-xl font-bold text-green-700">₹{cartTotal}</span>
                  </div>
                  <button onClick={handlePlaceOrder} className="w-full mb-2 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md"> Place Order </button>
                  <button onClick={handleClearCart} className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-sm shadow-md"> Clear Cart </button>
              </div>
          )}
      </div>
       {/* Overlay Removed */}
    </div>
  );
}