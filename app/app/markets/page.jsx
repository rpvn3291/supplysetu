// filename: app/markets/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function MarketsPage() {
  const [activeMarkets, setActiveMarkets] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error("No auth token found.");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    // Listen for the initial list of active markets
    newSocket.on('active_markets_list', (markets) => {
      setActiveMarkets(Object.values(markets));
    });

    // Listen for new markets that start after you've connected
    newSocket.on('new_market_started', (newMarket) => {
      setActiveMarkets((prevMarkets) => [...prevMarkets, newMarket]);
    });
    
    // Listen for when a market closes
    newSocket.on('market_closed', ({ marketId }) => {
        setActiveMarkets((prevMarkets) => prevMarkets.filter(m => m.marketId !== marketId));
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/">&larr; Back to Home</Link>
      <h1>Live Markets</h1>
      {activeMarkets.length === 0 ? (
        <p>There are no active markets right now. Check back soon!</p>
      ) : (
        <div>
          {activeMarkets.map((market) => (
            <div key={market.marketId} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <h2>{market.productName}</h2>
              <p>Supplier: {market.supplierId.substring(0, 10)}...</p>
              <p>Starting Price: ${market.currentPrice}</p>
              <Link href={`/markets/${market.marketId}`}>
                <button>Join Market</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
    