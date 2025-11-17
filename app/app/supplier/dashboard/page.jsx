// filename: app/supplier/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client'; // Import socket.io client

// --- Icons (Inline SVGs for simplicity) ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L7.029 20.971H4v-3.029l10.586-10.586z" />
    </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const MarketIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
     </svg>
);
// --- End Icons ---


export default function SupplierDashboard() {
  const [myProducts, setMyProducts] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [socket, setSocket] = useState(null); // Socket state

  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // --- Fetch All Supplier Data ---
  const fetchSupplierData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You are not logged in.');
      setLoading(false);
      return;
    }

    try {
      const [productsRes, profileRes, ordersRes] = await Promise.all([
        fetch('/api/products/myproducts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/orders/incoming', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const productsData = await productsRes.json();
      if (!productsRes.ok) throw new Error(productsData.message || 'Failed to fetch products');
      setMyProducts(productsData);

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || 'Failed to fetch profile');
      setSupplierProfile(profileData);

      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.message || 'Failed to fetch incoming orders');
      // Enrich incoming orders with product names if possible
      const enrichedOrders = await enrichOrders(ordersData, productsData);
      setIncomingOrders(enrichedOrders);


    } catch (err) {
      setError(err.message);
      console.error("Fetch Supplier Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to add product names to incoming orders ---
  const enrichOrders = async (orderItems, products) => {
      return orderItems.map(item => {
          const product = products.find(p => p._id === item.productId);
          return {
              ...item,
              productName: product?.name || 'Unknown Product'
          };
      });
  };

  // --- Connect to Socket.IO for market errors/success ---
  useEffect(() => {
    fetchSupplierData(); // Initial data fetch

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('market_error', (error) => setMessage(`Market Error: ${error.message}`));
    newSocket.on('new_market_started', (market) => setMessage(`Market for ${market.productName} started successfully!`));
    newSocket.on('connect_error', (err) => console.error("Socket connection error:", err.message));

    return () => newSocket.disconnect();
  }, []); // Run only once on mount

  // --- Form Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  // --- CRUD Handlers ---
  const handleCreateProduct = async (e) => { /* ... existing logic ... */ await fetchSupplierData(); };
  const handleUpdateProduct = async (e) => { /* ... existing logic ... */ await fetchSupplierData(); };
  const handleDeleteProduct = async (productId) => { /* ... existing logic ... */ await fetchSupplierData(); };

  // --- Start Market Handler ---
  const handleStartMarket = () => {
    if (!socket) return setMessage('Not connected to real-time service.');
    // Simple prompt-based for now
    const productId = prompt("Enter Product ID to market:");
    const productName = prompt("Enter Product Name:");
    const startingPriceStr = prompt("Enter Starting Price (₹):");
    const startingPrice = parseFloat(startingPriceStr);

    if (productId && productName && !isNaN(startingPrice) && startingPrice > 0) {
        setMessage('Attempting to start market...');
        socket.emit('start_market', { productId, productName, startingPrice });
    } else {
        setMessage('Invalid market details provided.');
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Supplier Dashboard</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            &larr; Back to Home
          </Link>
        </div>

        {/* Message and Error Area */}
        {message && <div className={`p-3 mb-6 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-100 text-green-700' : (message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}>{message}</div>}
        {error && <div className="p-3 mb-6 rounded-lg text-sm font-medium bg-red-100 text-red-700">Error: {error}</div>}


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Column 1: Incoming Orders & Start Market */}
          <div className="lg:col-span-1 space-y-6">
            {/* Incoming Orders Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Incoming Orders</h2>
              {loading && <p className="text-sm text-gray-500">Loading orders...</p>}
              {!loading && incomingOrders.length === 0 && <p className="text-sm text-gray-500">No incoming orders yet.</p>}
              {!loading && incomingOrders.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {incomingOrders.map(item => (
                    <div key={item.id} className="border-b border-gray-100 pb-2 text-sm">
                      <p className="font-medium text-gray-700">{item.productName || `Product ID: ${item.productId.substring(0,8)}...`}</p>
                      <p className="text-gray-500">Qty: {item.quantity} {item.unitOfMeasure || ''}</p>
                      <p className="text-xs text-gray-400">Order #{item.orderId.substring(0, 8)}... ({new Date(item.order.createdAt).toLocaleDateString()})</p>
                      {/* Add Accept/Ship buttons here later */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start Live Market Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Start Live Market</h2>
                <p className="text-xs text-gray-500 mb-4">
                    Run short, real-time bidding events. (Active Hours: 6 AM - 6 PM IST)
                </p>
                <button
                    onClick={handleStartMarket}
                    className="w-full px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition shadow flex items-center justify-center"
                >
                   <MarketIcon /> Start New Market Session
                </button>
            </div>
          </div>


          {/* Column 2: Create Product & My Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create New Product Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><PlusIcon /> Create New Product</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                  {/* Using grid for better form layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="text-sm font-medium text-gray-600">Name</label><input name="name" value={newProduct.name} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md"/></div>
                     <div><label className="text-sm font-medium text-gray-600">Category</label><select name="category" value={newProduct.category} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option>Vegetables</option><option>Fruits</option><option>Dairy</option><option>Spices</option><option>Groceries</option><option>Disposables</option><option>Other</option></select></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-600">Description</label><textarea name="description" value={newProduct.description} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md h-20"/></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium text-gray-600">Price (₹)</label><input type="number" step="0.01" min="0" name="price" value={newProduct.price} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md"/></div>
                      <div><label className="text-sm font-medium text-gray-600">Unit</label><input name="unit" value={newProduct.unit} onChange={handleFormChange} required placeholder="e.g., kg, pack" className="mt-1 w-full p-2 border rounded-md"/></div>
                      <div><label className="text-sm font-medium text-gray-600">Stock</label><input type="number" min="0" name="stock" value={newProduct.stock} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md"/></div>
                  </div>
                   <div><label className="text-sm font-medium text-gray-600">Image URL (Optional)</label><input type="url" name="imageUrl" value={newProduct.imageUrl} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded-md"/></div>
                  <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow">Add Product to Inventory</button>
              </form>
            </div>

            {/* My Listed Products Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Listed Products</h2>
              {loading && <p className="text-sm text-gray-500">Loading products...</p>}
              {!loading && myProducts.length === 0 && <p className="text-sm text-gray-500">You haven't listed any products yet.</p>}
              {!loading && myProducts.length > 0 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {myProducts.map((product) => (
                    <div key={product._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                       {/* Editing View */}
                       {editingProduct && editingProduct._id === product._id ? (
                           <form onSubmit={handleUpdateProduct} className="space-y-3">
                                <input name="name" value={editingProduct.name} onChange={handleEditFormChange} className="w-full p-2 border rounded-md text-lg font-semibold"/>
                                <textarea name="description" value={editingProduct.description} onChange={handleEditFormChange} className="w-full p-2 border rounded-md text-sm"/>
                                <div className="flex gap-4">
                                    <input type="number" step="0.01" name="price" value={editingProduct.price} onChange={handleEditFormChange} className="w-1/2 p-2 border rounded-md text-sm" placeholder="Price"/>
                                    <input type="number" name="stock" value={editingProduct.stock} onChange={handleEditFormChange} className="w-1/2 p-2 border rounded-md text-sm" placeholder="Stock"/>
                                </div>
                                <div className="flex gap-2 mt-2">
                                     <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition">Save</button>
                                     <button type="button" onClick={() => setEditingProduct(null)} className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition">Cancel</button>
                                </div>
                            </form>
                       ) : (
                           // Display View
                           <div className="flex justify-between items-start">
                               <div>
                                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                    <p className="text-xs text-gray-500 mb-1">{product.description}</p>
                                    <span className="text-sm font-bold text-green-700">₹{product.price.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500"> / {product.unit} | Stock: {product.stock}</span>
                               </div>
                               <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => setEditingProduct(product)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition whitespace-nowrap"><EditIcon/> Edit</button>
                                    <button onClick={() => handleDeleteProduct(product._id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition whitespace-nowrap"><DeleteIcon/> Delete</button>
                               </div>
                           </div>
                       )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}