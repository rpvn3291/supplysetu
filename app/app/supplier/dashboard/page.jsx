// filename: app/supplier/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SupplierDashboard() {
  const [myProducts, setMyProducts] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [supplierProfile, setSupplierProfile] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);

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
      setIncomingOrders(ordersData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!supplierProfile) {
      setMessage('Supplier profile not loaded yet. Please wait.');
      return;
    }
    setMessage('Creating product...');
    const token = localStorage.getItem('authToken');

    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10),
      supplierName: supplierProfile.profile.companyName,
      supplierLocationLat: supplierProfile.profile.latitude,
      supplierLocationLon: supplierProfile.profile.longitude,
      isVerified: supplierProfile.user.isVerified,
    };
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create product');
      setMessage(`Product "${data.name}" created successfully!`);
      setNewProduct({ name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: '' });
      fetchSupplierData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };
  
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setMessage(`Updating ${editingProduct.name}...`);
    const token = localStorage.getItem('authToken');
    const updatedData = {
      ...editingProduct,
      price: parseFloat(editingProduct.price),
      stock: parseInt(editingProduct.stock, 10),
    };

    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update product');
      setMessage(`Product "${data.name}" updated successfully!`);
      setEditingProduct(null);
      fetchSupplierData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setMessage('Deleting product...');
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete product');
      setMessage(data.message);
      fetchSupplierData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>Supplier Dashboard</h1>
        {message && <p style={{ color: 'blue' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ border: '2px solid blue', padding: '15px', marginBottom: '20px' }}>
          <h2>Incoming Orders</h2>
          {loading && <p>Loading incoming orders...</p>}
          {!loading && incomingOrders.length === 0 && <p>No incoming orders for your products yet.</p>}
          {!loading && incomingOrders.length > 0 && (
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

        <div style={{ border: '2px solid #333', padding: '15px', marginBottom: '20px' }}>
            <h2>Create New Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: '10px' }}><label>Name: </label><input name="name" value={newProduct.name} onChange={handleFormChange} required /></div>
              <div style={{ marginBottom: '10px' }}><label>Description: </label><textarea name="description" value={newProduct.description} onChange={handleFormChange} required /></div>
              <div style={{ marginBottom: '10px' }}><label>Price: </label><input type="number" name="price" value={newProduct.price} onChange={handleFormChange} required step="0.01" /></div>
              <div style={{ marginBottom: '10px' }}><label>Category: </label><select name="category" value={newProduct.category} onChange={handleFormChange}><option value="Vegetables">Vegetables</option><option value="Fruits">Fruits</option><option value="Dairy">Dairy</option><option value="Spices">Spices</option><option value="Groceries">Groceries</option><option value="Disposables">Disposables</option><option value="Other">Other</option></select></div>
              <div style={{ marginBottom: '10px' }}><label>Unit (e.g., kg, pack): </label><input name="unit" value={newProduct.unit} onChange={handleFormChange} required /></div>
              <div style={{ marginBottom: '10px' }}><label>Stock: </label><input type="number" name="stock" value={newProduct.stock} onChange={handleFormChange} required /></div>
              <div style={{ marginBottom: '10px' }}><label>Image URL (optional): </label><input type="url" name="imageUrl" value={newProduct.imageUrl} onChange={handleFormChange} /></div>
              <button type="submit">Create Product</button>
            </form>
        </div>

        <div style={{ marginTop: '20px' }}>
            <h2>My Listed Products</h2>
            {loading && <p>Loading your products...</p>}
            {!loading && myProducts.length === 0 ? (<p>You have not listed any products yet.</p>) : (
              myProducts.map((product) => (
                <div key={product._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  {editingProduct && editingProduct._id === product._id ? (
                    <form onSubmit={handleUpdateProduct}>
                      <input name="name" value={editingProduct.name} onChange={handleEditFormChange} />
                      <textarea name="description" value={editingProduct.description} onChange={handleEditFormChange} />
                      <input type="number" name="price" value={editingProduct.price} onChange={handleEditFormChange} />
                      <input type="number" name="stock" value={editingProduct.stock} onChange={handleEditFormChange} />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
                    </form>
                  ) : (
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <p><strong>Price:</strong> ${product.price} per {product.unit}</p>
                      <p><strong>Stock:</strong> {product.stock}</p>
                      <button onClick={() => setEditingProduct(product)}>Edit</button>
                      <button onClick={() => handleDeleteProduct(product._id)} style={{marginLeft: '10px'}}>Delete</button>
                    </div>
                  )}
                </div>
              ))
            )}
        </div>
    </div>
  );
}

