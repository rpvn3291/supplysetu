// filename: app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// --- Icons (Inline SVGs) ---
const VerifiedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
const BlockchainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
    </svg>
);
// --- End Icons ---


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
        setError(null);
        // Call the API Gateway route for a single product
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch product details');
        }
        setProduct(data);
      } catch (err) {
        setError(err.message);
        console.error("Fetch Product Detail Error:", err);
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
    if (!token) return setMessage('Please log in to add items.');

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add item');
      }
      setMessage(`${product.name} added to cart!`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error("Add to Cart Error:", err);
    }
  };


  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-gray-600">Loading product details...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <Link href="/products" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to all products</Link>
        <p className="text-center text-red-600 mt-10">Error: {error}</p>
    </div>
  );
  if (!product) return (
     <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <Link href="/products" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to all products</Link>
        <p className="text-center text-gray-500 mt-10">Product not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div className="container mx-auto max-w-4xl">
            <Link href="/products" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to all products</Link>
            
            {message && <p className="p-3 rounded-lg bg-blue-100 text-blue-700 mb-4">{message}</p>}

            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e)=>{e.target.onerror = null; e.target.src="https://placehold.co/600x400/eee/ccc?text=Image+Missing"}}/>
                        ) : (
                            <span className="text-gray-500">Image Not Available</span>
                        )}
                    </div>
                    
                    {/* Details Section */}
                    <div className="p-6 md:p-8 flex flex-col">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
                        
                        {/* --- Trust Signals --- */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mb-4">
                            <span className="text-sm text-gray-600">
                                Sold by: <span className="font-semibold text-blue-600">{product.supplierName}</span>
                            </span>
                            {product.isVerified ? (
                              <span className="flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                <VerifiedIcon /> Verified Supplier
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                Unverified
                              </span>
                            )}
                             <span className="flex items-center text-sm font-medium text-gray-600">
                                <StarIcon /> 
                                <span className="ml-1">{product.qualityRating > 0 ? product.qualityRating.toFixed(1) : 'New'} (0 ratings)</span>
                            </span>
                        </div>

                        <p className="text-gray-700 mb-4 text-sm leading-relaxed">{product.description}</p>
                        
                        <div className="flex justify-between items-center mb-6 mt-2">
                            {/* --- UPDATED: Currency --- */}
                            <span className="text-4xl font-bold text-green-700">₹{product.price.toFixed(2)}</span>
                            <span className="text-lg text-gray-500">per {product.unit}</span>
                        </div>
                        
                        <p className="text-md text-gray-600 mb-6">
                            <strong>Available Stock:</strong> 
                            <span className={`font-semibold ${product.stock > 10 ? 'text-gray-700' : 'text-red-500'}`}>
                                {product.stock > 0 ? ` ${product.stock} units` : ' Out of Stock'}
                            </span>
                        </p>
                        
                        <button 
                            onClick={addToCart} 
                            disabled={product.stock === 0}
                            className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
                
                {/* --- Traceability Section --- */}
                <div className="border-t border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                        <BlockchainIcon /> Product Traceability
                    </h2>
                    <p className="text-sm text-gray-600">
                        This product's origin and journey are verified on the Supply Setu blockchain.
                    </p>
                    <a href="#" className="text-xs text-blue-500 hover:underline mt-2 inline-block" title="This feature is in development">
                        View Transaction History (Coming Soon)
                    </a>
                </div>

            </div>
        </div>
    </div>
  );
}