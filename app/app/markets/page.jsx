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
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Please log in to view markets.");
      setLoading(false);
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);
    setLoading(true); // Start loading

    // Listen for the initial list
    newSocket.on('active_markets_list', (markets) => {
      setActiveMarkets(Object.values(markets));
      setLoading(false); // Stop loading after getting the list
    });

    // Listen for new markets
    newSocket.on('new_market_started', (newMarket) => {
      setActiveMarkets((prevMarkets) => {
        // Avoid adding duplicates if already received in initial list
        if (!prevMarkets.some(m => m.marketId === newMarket.marketId)) {
           return [...prevMarkets, newMarket];
        }
        return prevMarkets;
      });
    });

    // Listen for closed markets
    newSocket.on('market_closed', ({ marketId }) => {
        setActiveMarkets((prevMarkets) => prevMarkets.filter(m => m.marketId !== marketId));
    });
    
    // Handle connection errors
    newSocket.on('connect_error', (err) => {
        console.error("Socket connection error:", err.message);
        setError("Could not connect to the market service.");
        setLoading(false);
    });

    // Cleanup
    return () => newSocket.disconnect();
  }, []);

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
                    <ClockIcon /> Market Hours: 6:00 AM - 6:00 PM IST Daily
                </div>
            </div>

             {/* Loading and Error States */}
            {loading && <p className="text-center text-gray-500 mt-10">Connecting to live markets...</p>}
            {error && <p className="text-center text-red-600 mt-10">Error: {error}</p>}


            {/* Market List */}
            {!loading && !error && (
                <div>
                    {activeMarkets.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10 bg-white p-6 rounded-lg shadow">There are no active markets right now. Check back soon!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeMarkets.map((market) => (
                                // Market Card
                                <div key={market.marketId} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition duration-200">
                                   <div className="p-5 flex flex-col flex-grow">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">Live Deal</span>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">{market.productName}</h2>
                                        <p className="text-sm text-gray-500 mb-1">Supplier: {market.supplierId.substring(0, 8)}...</p>
                                        <p className="text-lg font-semibold text-green-700 mb-4">Starts at: ₹{market.currentPrice.toFixed(2)}</p>
                                        {/* You could add a countdown timer here later */}
                                        <Link href={`/markets/${market.marketId}`} legacyBehavior>
                                            <a className="w-full mt-auto text-center py-2 px-4 rounded-md font-semibold text-white bg-teal-500 hover:bg-teal-600 transition shadow">
                                                Join Market & Bid
                                            </a>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}
        </div>
    </div>
  );
}