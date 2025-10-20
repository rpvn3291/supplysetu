// filename: app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook to get URL parameters
import Link from 'next/link';

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  const params = useParams(); // { id: 'some-product-id' }
  const { id } = params;

  useEffect(() => {
    if (!id) return; // Don't fetch if there's no ID

    const fetchProduct = async () => {
      try {
        setLoading(true);
        // We can reuse the existing API gateway route for a single product
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch product details');
        }
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]); // Re-fetch if the ID in the URL changes

  const addToCart = async () => {
    if (!product) return;
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
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };


  if (loading) return <p>Loading product details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/products">&larr; Back to all products</Link>
      
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      <div style={{ marginTop: '20px' }}>
        <h1>{product.name}</h1>
        {/* Simple image display */}
        {product.imageUrl && (
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                style={{ maxWidth: '400px', height: 'auto', margin: '20px 0' }}
                onError={(e) => { e.target.style.display='none' }} // Hide if image fails to load
            />
        )}
        <p>{product.description}</p>
        <p><strong>Category:</strong> {product.category}</p>
        <p><strong>Price:</strong> ${product.price.toFixed(2)} per {product.unit}</p>
        <p><strong>Available Stock:</strong> {product.stock}</p>
        <button onClick={addToCart} style={{ marginTop: '20px', padding: '10px' }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
