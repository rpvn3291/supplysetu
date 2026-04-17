// filename: app/markets/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';

// --- Clock Icon ---
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function MarketsPage() {
  const [activeMarkets, setActiveMarkets] = useState([]);
  const [myProducts, setMyProducts] = useState([]); // Stores supplier's products from DB
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New Market Form State
  const [showStartForm, setShowStartForm] = useState(false);
  const [flashTitle, setFlashTitle] = useState('');
  const [stagedProducts, setStagedProducts] = useState([]);
  const [newMarket, setNewMarket] = useState({ productId: '', productName: '', price: '', stockQuantity: '' });
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Please log in to view markets.");
      setLoading(false);
      return;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setMyRole(JSON.parse(jsonPayload).role);
    } catch(e) {}
    
    // Fetch Supplier's Products for the dropdown
    fetch('http://localhost:3002/api/products/myproducts', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        // Handle varying response envelopes (array directly or {products: []})
        if (Array.isArray(data)) setMyProducts(data);
        else if (data && Array.isArray(data.products)) setMyProducts(data.products);
    })
    .catch(err => console.error("Error fetching supplier products:", err));

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL || 'http://localhost:3005', {
      auth: { token }
    });
    setSocket(newSocket);
    setLoading(true);

    newSocket.on('active_markets_list', (markets) => {
      setActiveMarkets(Object.values(markets));
      setLoading(false);
    });

    newSocket.on('new_market_started', (marketData) => {
      setActiveMarkets((prev) => {
        if (!prev.some(m => m.marketId === marketData.marketId)) {
           return [...prev, marketData];
        }
        return prev;
      });
    });

    newSocket.on('market_closed', ({ marketId }) => {
        setActiveMarkets((prev) => prev.filter(m => m.marketId !== marketId));
    });
    
    newSocket.on('connect_error', (err) => {
        setError("Could not connect to the market service.");
        setLoading(false);
    });

    newSocket.on('market_error', (data) => {
        setError(data.message);
        setLoading(false);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleProductSelection = (e) => {
      const selectedId = e.target.value;
      const product = myProducts.find(p => (p._id || p.id) === selectedId);
      if (product) {
          setNewMarket({
              productId: selectedId,
              productName: product.name,
              price: product.price?.toString() || '',
              stockQuantity: product.stock?.toString() || ''
          });
      }
  };

  const handleAddProduct = () => {
      if (newMarket.productId && newMarket.productName && newMarket.price && newMarket.stockQuantity) {
          setStagedProducts(prev => [...prev, { ...newMarket, price: parseFloat(newMarket.price), stockQuantity: parseInt(newMarket.stockQuantity, 10) }]);
          setNewMarket({ productId: '', productName: '', price: '', stockQuantity: '' });
      }
  };

  const handleStartMarket = (e) => {
    e.preventDefault();
    if(socket && stagedProducts.length > 0) {
        socket.emit('start_market', { title: flashTitle || "Exclusive Flash Deals", products: stagedProducts });
        setShowStartForm(false);
        setStagedProducts([]);
        setFlashTitle('');
        setNewMarket({ productId: '', productName: '', price: '', stockQuantity: '' });
        alert("Live Flash Deal Started! You will be redirected if successful.");
    } else {
        alert("Please add at least one product to the deal package.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8">
        <div className="container mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link href="/" className="text-blue-600 hover:underline">
                    &larr; Back to Home
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Live Markets</h1>
                <div className="text-sm text-gray-600 bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-full flex items-center">
                    <ClockIcon /> Market Hours: 24/7 Live Deals
                </div>
            </div>

            {myRole === 'SUPPLIER' && (
                <div className="mb-8">
                    <button 
                        onClick={() => setShowStartForm(!showStartForm)} 
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                    >
                        {showStartForm ? 'Cancel' : 'Go Live Now'}
                    </button>
                    
                    {showStartForm && (
                        <div className="bg-white p-6 rounded-lg shadow mt-4 border border-blue-100">
                            <h2 className="text-lg font-bold mb-4">Start a Multi-Item Flash Sale</h2>
                            <form onSubmit={handleStartMarket} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 mb-2">
                                    <label className="block text-sm text-gray-600 mb-1">Flash Deal Title</label>
                                    <input type="text" placeholder="e.g. Mega Morning Produce Sale" value={flashTitle} onChange={e => setFlashTitle(e.target.value)} className="border w-full p-2 rounded" />
                                </div>
                                
                                {/* PENDING PRODUCTS LIST */}
                                {stagedProducts.length > 0 && (
                                    <div className="md:col-span-2 mb-4 p-4 bg-gray-50 border rounded-lg">
                                        <h3 className="font-bold mb-2">Deal Package Items:</h3>
                                        {stagedProducts.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b py-2">
                                                <span className="font-semibold">{p.productName}</span>
                                                <span className="text-green-700 font-bold">{p.stockQuantity}x @ ₹{p.price}</span>
                                                <button type="button" onClick={() => setStagedProducts(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-2">Drop</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PRODUCT DROPDOWN */}
                                <select 
                                    value={newMarket.productId} 
                                    onChange={handleProductSelection} 
                                    className="border p-2 rounded col-span-1 md:col-span-2 bg-white text-gray-800"
                                >
                                    <option value="" disabled>Select a Product from your Inventory</option>
                                    {myProducts.length === 0 && <option disabled>Loading products or none found...</option>}
                                    {myProducts.map(p => (
                                        <option key={p._id || p.id} value={p._id || p.id}>
                                            {p.name} (Current Stock & Price: {p.stock || 'N/A'}, ₹{p.price || 0})
                                        </option>
                                    ))}
                                </select>
                                
                                {/* PRICE AND STOCK OVERRIDES */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Live Deal Price (₹)</label>
                                    <input type="number" step="0.01" value={newMarket.price} onChange={e => setNewMarket({...newMarket, price: e.target.value})} className="border w-full p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Stock Dedicated</label>
                                    <input type="number" step="1" value={newMarket.stockQuantity} onChange={e => setNewMarket({...newMarket, stockQuantity: e.target.value})} className="border w-full p-2 rounded" />
                                </div>

                                <button type="button" onClick={handleAddProduct} className="md:col-span-2 bg-blue-50 text-blue-700 font-bold py-2 border border-blue-300 rounded shadow-sm hover:bg-blue-100 mt-2">+ Add Item</button>
                                
                                <button type="submit" className="md:col-span-2 bg-green-600 text-white font-bold py-3 rounded shadow hover:bg-green-700 mt-4 text-lg">🚀 Launch Flash Deal Now!</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {loading && <p className="text-center text-gray-500 mt-10">Connecting to live markets...</p>}
            {error && <p className="text-center text-red-600 mt-10">Error: {error}</p>}

            {!loading && !error && (
                <div>
                    {activeMarkets.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10 bg-white p-6 rounded-lg shadow">There are no active markets right now. Start one above to get sales!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeMarkets.map((market) => {
                                const totalStock = market.products?.reduce((acc, p) => acc + p.stockQuantity, 0) || 0;
                                const itemCount = market.products?.length || 0;
                                return (
                                <div key={market.marketId} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition duration-200">
                                   <div className="p-5 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">● FLASH DEAL</span>
                                            <span className="text-xs font-bold text-gray-500">{totalStock} total stock</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">{market.title}</h2>
                                        <p className="text-sm text-gray-500 mb-1">Supplier: {market.supplierId.substring(0, 8)}...</p>
                                        <p className="text-lg font-semibold text-blue-700 mb-4">{itemCount} items on sale</p>
                                        
                                        <Link href={`/markets/${market.marketId}`} className="w-full mt-auto py-2 px-4 rounded-md font-semibold text-white bg-teal-500 hover:bg-teal-600 transition shadow text-center block">
                                            Enter Deal Room
                                        </Link>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                 </div>
            )}
        </div>
    </div>
  );
}