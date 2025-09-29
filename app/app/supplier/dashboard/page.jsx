// filename: app/supplier/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function SupplierDashboard() {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // State for the "Create New Product" form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Vegetables',
    unit: '',
    stock: '',
    imageUrl: '',
  });
  
  // --- NEW: State to manage which product is being edited ---
  const [editingProduct, setEditingProduct] = useState(null); // Will hold the product object being edited

  // Function to fetch the supplier's own products
  const fetchMyProducts = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You are not logged in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/products/myproducts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
      setMyProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  
  // --- NEW: Handler for changes in the edit form ---
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setMessage('Creating product...');
    const token = localStorage.getItem('authToken');

    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10),
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
      fetchMyProducts();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };
  
  // --- NEW: Function to handle updating a product ---
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
      setEditingProduct(null); // Exit editing mode
      fetchMyProducts(); // Refresh the list
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // --- NEW: Function to handle deleting a product ---
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
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
      fetchMyProducts(); // Refresh the list
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };


  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Supplier Dashboard</h1>
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      {/* Create New Product Form */}
      <div style={{ border: '2px solid #333', padding: '15px', marginBottom: '20px' }}>
        <h2>Create New Product</h2>
        {/* Create form remains unchanged */}
        <form onSubmit={handleCreateProduct}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name: </label>
            <input name="name" value={newProduct.name} onChange={handleFormChange} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description: </label>
            <textarea name="description" value={newProduct.description} onChange={handleFormChange} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Price: </label>
            <input type="number" name="price" value={newProduct.price} onChange={handleFormChange} required step="0.01" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Category: </label>
            <select name="category" value={newProduct.category} onChange={handleFormChange}>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Dairy">Dairy</option>
              <option value="Spices">Spices</option>
              <option value="Groceries">Groceries</option>
              <option value="Disposables">Disposables</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Unit (e.g., kg, pack): </label>
            <input name="unit" value={newProduct.unit} onChange={handleFormChange} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Stock: </label>
            <input type="number" name="stock" value={newProduct.stock} onChange={handleFormChange} required />
          </div>
           <div style={{ marginBottom: '10px' }}>
            <label>Image URL (optional): </label>
            <input type="url" name="imageUrl" value={newProduct.imageUrl} onChange={handleFormChange} />
          </div>
          <button type="submit">Create Product</button>
        </form>
      </div>

      {/* My Products List */}
      <div style={{ marginTop: '20px' }}>
        <h2>My Listed Products</h2>
        {loading && <p>Loading your products...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!loading && !error && (
          <div>
            {myProducts.length === 0 ? (
              <p>You have not listed any products yet.</p>
            ) : (
              myProducts.map((product) => (
                <div key={product._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  {/* --- NEW: Conditional rendering for editing --- */}
                  {editingProduct && editingProduct._id === product._id ? (
                    // EDITING VIEW
                    <form onSubmit={handleUpdateProduct}>
                      <input name="name" value={editingProduct.name} onChange={handleEditFormChange} />
                      <textarea name="description" value={editingProduct.description} onChange={handleEditFormChange} />
                      <input type="number" name="price" value={editingProduct.price} onChange={handleEditFormChange} />
                      <input type="number" name="stock" value={editingProduct.stock} onChange={handleEditFormChange} />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
                    </form>
                  ) : (
                    // DISPLAY VIEW
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
        )}
      </div>
    </div>
  );
}

