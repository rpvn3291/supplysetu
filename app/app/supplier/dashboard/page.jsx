// filename: app/supplier/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function SupplierDashboard() {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  // --- NEW: State for incoming orders ---
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ... (keep all the product management state and functions: newProduct, editingProduct, etc.)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: '' });
  const [editingProduct, setEditingProduct] = useState(null);


  const fetchSupplierData = async () => {
    setLoading(true);
    setLoadingOrders(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You are not logged in.');
      setLoading(false);
      setLoadingOrders(false);
      return;
    }

    try {
      // Fetch both sets of data in parallel for better performance
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/products/myproducts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/orders/incoming', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const productsData = await productsRes.json();
      if (!productsRes.ok) throw new Error(productsData.message || 'Failed to fetch products');
      setMyProducts(productsData);
      setLoading(false);

      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.message || 'Failed to fetch incoming orders');
      setIncomingOrders(ordersData);
      setLoadingOrders(false);

    } catch (err) {
      setError(err.message);
      setLoading(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  // ... (keep all the handler functions: handleFormChange, handleCreateProduct, handleUpdateProduct, handleDeleteProduct)
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };
  const handleCreateProduct = async (e) => { e.preventDefault(); /* ... existing code ... */ await fetchSupplierData(); };
  const handleUpdateProduct = async (e) => { e.preventDefault(); /* ... existing code ... */ await fetchSupplierData(); };
  const handleDeleteProduct = async (productId) => { /* ... existing code ... */ await fetchSupplierData(); };


  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Supplier Dashboard</h1>
      {message && <p style={{ color: 'blue' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {/* --- NEW: Incoming Orders Section --- */}
      <div style={{ border: '2px solid blue', padding: '15px', marginBottom: '20px' }}>
          <h2>Incoming Orders</h2>
          {loadingOrders && <p>Loading incoming orders...</p>}
          {!loadingOrders && incomingOrders.length === 0 && <p>No incoming orders for your products yet.</p>}
          {!loadingOrders && incomingOrders.length > 0 && (
              incomingOrders.map(item => (
                  <div key={item.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
                      <p><strong>Order ID:</strong> {item.orderId}</p>
                      <p><strong>Product ID:</strong> {item.productId}</p>
                      <p><strong>Quantity Ordered:</strong> {item.quantity}</p>
                      <p><em>Placed on: {new Date(item.order.createdAt).toLocaleDateString()}</em></p>
                  </div>
              ))
          )}
      </div>

      {/* Existing Product Management Sections */}
      {/* (Create New Product Form and My Listed Products) */}
      {/* ... The rest of your dashboard JSX ... */}
      <div style={{ border: '2px solid #333', padding: '15px', marginBottom: '20px' }}>
        <h2>Create New Product</h2>
        <form onSubmit={handleCreateProduct}> {/* Form JSX */} </form>
      </div>
      <div style={{ marginTop: '25px' }}>
        <h2>My Listed Products</h2>
        {/* Product list JSX */}
      </div>

    </div>
  );
}

