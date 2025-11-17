// filename: app/supplier/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Keep Link if needed

// --- Icons ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L7.029 20.971H4v-3.029l10.586-10.586z" /> </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg>
);
// --- End Icons ---

export default function ManageProductsPage() {
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [supplierProfile, setSupplierProfile] = useState(null);

    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: '' });
    const [editingProduct, setEditingProduct] = useState(null);

    // --- Fetch Supplier's Products and Profile ---
    const fetchSupplierData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('You must be logged in as a supplier.');
            setLoading(false);
            return;
        }
        try {
            const [productsRes, profileRes] = await Promise.all([
                fetch('/api/products/myproducts', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const productsData = await productsRes.json();
            if (!productsRes.ok) throw new Error(productsData.message || 'Failed to fetch your products');
            setMyProducts(productsData);
            const profileData = await profileRes.json();
            if (!profileRes.ok) throw new Error(profileData.message || 'Failed to fetch your profile');
            if (profileData?.user?.role !== 'SUPPLIER' || !profileData.profile) {
                throw new Error('Logged in user is not a supplier or profile data is missing.');
            }
            setSupplierProfile(profileData);
        } catch (err) {
            setError(err.message);
            console.error("Fetch Supplier Data Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierData();
    }, []);

    // --- Form Handlers ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({ ...prev, [name]: value }));
    };

    // --- CRUD API Call Handlers ---
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!supplierProfile) {
            setMessage('Error: Supplier profile not loaded.');
            return;
        }
        setMessage('Creating product...');
        setError(null);
        const token = localStorage.getItem('authToken');

        // Construct product data including denormalized fields
        const productData = {
            ...newProduct,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock, 10),
            // Denormalized fields from the supplier's profile
            supplierName: supplierProfile.profile.companyName,
            supplierLocationLat: supplierProfile.profile.latitude,
            supplierLocationLon: supplierProfile.profile.longitude,
            isVerified: supplierProfile.user.isVerified,
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(productData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create product');

            setMessage(`Product "${data.name}" created successfully!`);
            setNewProduct({ name: '', description: '', price: '', category: 'Vegetables', unit: '', stock: '', imageUrl: '' }); // Reset form
            fetchSupplierData(); // Refresh product list
        } catch (err) {
            setMessage(''); // Clear loading message
            setError(`Error creating product: ${err.message}`);
            console.error("Create Product Error:", err);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        setMessage(`Updating ${editingProduct.name}...`);
        setError(null);
        const token = localStorage.getItem('authToken');

        // Prepare only the fields that can be updated
        const updatedData = {
            name: editingProduct.name,
            description: editingProduct.description,
            price: parseFloat(editingProduct.price),
            stock: parseInt(editingProduct.stock, 10),
            category: editingProduct.category, // Assuming category can be updated
            unit: editingProduct.unit,         // Assuming unit can be updated
            imageUrl: editingProduct.imageUrl    // Assuming image URL can be updated
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
            fetchSupplierData(); // Refresh list
        } catch (err) {
            setMessage('');
            setError(`Error updating product: ${err.message}`);
            console.error("Update Product Error:", err);
        }
    };

    const handleDeleteProduct = async (productId, productName) => {
        // Use productName in the confirmation for better UX
        if (!window.confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) {
            return;
        }
        setMessage(`Deleting ${productName}...`);
        setError(null);
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to delete product');

            setMessage(data.message || `Product "${productName}" deleted successfully.`);
            fetchSupplierData(); // Refresh list
        } catch (err) {
            setMessage('');
            setError(`Error deleting product: ${err.message}`);
            console.error("Delete Product Error:", err);
        }
    };

    // --- JSX ---
    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Manage My Products</h1>

            {message && <div className={`p-3 mb-6 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('deleted') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{message}</div>}
            {error && <div className="p-3 mb-6 rounded-lg text-sm font-medium bg-red-100 text-red-700">Error: {error}</div>}

            {/* Create New Product Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
               <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><PlusIcon /> Add New Product</h2>
               <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="text-sm font-medium text-gray-600 block mb-1">Name</label><input name="name" value={newProduct.name} onChange={handleFormChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/></div>
                         <div><label className="text-sm font-medium text-gray-600 block mb-1">Category</label><select name="category" value={newProduct.category} onChange={handleFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-green-500 focus:border-green-500"><option>Vegetables</option><option>Fruits</option><option>Dairy</option><option>Spices</option><option>Groceries</option><option>Disposables</option><option>Other</option></select></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-600 block mb-1">Description</label><textarea name="description" value={newProduct.description} onChange={handleFormChange} required className="w-full p-2 border border-gray-300 rounded-md h-20 focus:ring-green-500 focus:border-green-500"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* --- UPDATED: Price Label --- */}
                        <div><label className="text-sm font-medium text-gray-600 block mb-1">Price (₹)</label><input type="number" step="0.01" min="0" name="price" value={newProduct.price} onChange={handleFormChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/></div>
                        <div><label className="text-sm font-medium text-gray-600 block mb-1">Unit</label><input name="unit" value={newProduct.unit} onChange={handleFormChange} required placeholder="e.g., kg, pack" className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/></div>
                        <div><label className="text-sm font-medium text-gray-600 block mb-1">Stock</label><input type="number" min="0" name="stock" value={newProduct.stock} onChange={handleFormChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-600 block mb-1">Image URL (Optional)</label><input type="url" name="imageUrl" value={newProduct.imageUrl} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/></div>
                    <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow">Add Product</button>
               </form>
            </div>

            {/* My Listed Products Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">My Listed Products</h2>
                {loading && <p className="text-sm text-gray-500">Loading products...</p>}
                {!loading && myProducts.length === 0 && <p className="text-sm text-gray-500">No products listed yet.</p>}
                {!loading && myProducts.length > 0 && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"> {/* Increased height */}
                        {myProducts.map((product) => (
                           <div key={product._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition duration-150">
                                {/* Editing View */}
                                {editingProduct && editingProduct._id === product._id ? (
                                    <form onSubmit={handleUpdateProduct} className="space-y-3">
                                        <div><label className="text-xs font-medium">Name</label><input name="name" value={editingProduct.name} onChange={handleEditFormChange} className="w-full p-1 border rounded text-sm"/></div>
                                        <div><label className="text-xs font-medium">Description</label><textarea name="description" value={editingProduct.description} onChange={handleEditFormChange} className="w-full p-1 border rounded text-sm h-16"/></div>
                                        <div className="flex gap-4">
                                            {/* --- UPDATED: Edit Price Label --- */}
                                            <div className="flex-1"><label className="text-xs font-medium">Price (₹)</label><input type="number" step="0.01" name="price" value={editingProduct.price} onChange={handleEditFormChange} className="w-full p-1 border rounded text-sm" /></div>
                                            <div className="flex-1"><label className="text-xs font-medium">Stock</label><input type="number" name="stock" value={editingProduct.stock} onChange={handleEditFormChange} className="w-full p-1 border rounded text-sm" /></div>
                                        </div>
                                         <div><label className="text-xs font-medium">Image URL</label><input type="url" name="imageUrl" value={editingProduct.imageUrl || ''} onChange={handleEditFormChange} className="w-full p-1 border rounded text-sm"/></div>
                                        <div className="flex gap-2 mt-2">
                                             <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition">Save Changes</button>
                                             <button type="button" onClick={() => setEditingProduct(null)} className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition">Cancel</button>
                                        </div>
                                    </form>
                               ) : (
                                   // Display View
                                   <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                       <div className="flex-grow">
                                            <h3 className="font-semibold text-gray-800 text-lg">{product.name}</h3>
                                            <p className="text-xs text-gray-500 mb-1 line-clamp-2">{product.description}</p>
                                            {/* --- UPDATED: Display Price Symbol --- */}
                                            <span className="text-base font-bold text-green-700">₹{(product.price || 0).toFixed(2)}</span>
                                            <span className="text-xs text-gray-500"> / {product.unit} | Stock: {product.stock}</span>
                                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${product.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.isVerified ? 'Verified' : 'Unverified'}</span>
                                       </div>
                                       <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 mt-2 sm:mt-0">
                                            <button onClick={() => setEditingProduct({...product})} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition whitespace-nowrap flex items-center justify-center"><EditIcon/> Edit</button>
                                            <button onClick={() => handleDeleteProduct(product._id, product.name)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition whitespace-nowrap flex items-center justify-center"><DeleteIcon/> Delete</button>
                                       </div>
                                   </div>
                               )}
                           </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}