// filename: app/markets/[marketId]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function MarketDetailPage() {
  const [market, setMarket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [myBid, setMyBid] = useState('');
  const [message, setMessage] = useState('');
  
  const params = useParams();
  const { marketId } = params;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !marketId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    // Join the specific market room
    newSocket.emit('join_market', marketId);

    // Listen for updates for this specific market
    newSocket.on('market_update', (marketData) => {
      setMarket(marketData);
    });

    newSocket.on('market_closed', () => {
        setMessage('This market has ended.');
        setMarket(null);
    });
    
    newSocket.on('bid_accepted', (data) => {
        alert(`Bid Accepted! ${data.message}`);
    });

    return () => newSocket.disconnect();
  }, [marketId]);

  const handleMakeBid = (e) => {
    e.preventDefault();
    if (socket && myBid > 0) {
      socket.emit('make_bid', { marketId, bidAmount: parseFloat(myBid) });
      setMessage(`You bid $${myBid}`);
    }
  };
  
  const handleAcceptBid = (vendorId) => {
      if (socket) {
          socket.emit('accept_bid', { marketId, vendorId });
      }
  };

  if (!market) {
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
             <Link href="/markets">&larr; Back to Markets</Link>
             <h1>Loading Market...</h1>
             {message && <p style={{color: 'red'}}>{message}</p>}
        </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/markets">&larr; Back to Markets</Link>
      <h1>Live Market: {market.productName}</h1>
      <p>Supplier: {market.supplierId.substring(0,10)}...</p>
      <p>Current Price: ${market.currentPrice}</p>
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      {/* Bidding Form for Vendors */}
      <div style={{ margin: '20px 0' }}>
        <h3>Place Your Bid</h3>
        <form onSubmit={handleMakeBid}>
          <input 
            type="number" 
            step="0.01"
            value={myBid}
            onChange={(e) => setMyBid(e.target.value)}
            placeholder="Enter your bid amount" 
          />
          <button type="submit">Make Bid</button>
        </form>
      </div>

      {/* List of Current Bids (Visible to Supplier) */}
      <div style={{ border: '1px solid #eee', padding: '10px' }}>
        <h3>Current Bids</h3>
        {Object.keys(market.bids).length === 0 ? <p>No bids yet.</p> : (
            Object.entries(market.bids).map(([vendorId, bidInfo]) => (
                <div key={vendorId}>
                    <span>Vendor ({bidInfo.userEmail}): ${bidInfo.bidAmount}</span>
                    {/* Accept button is only shown to the supplier who started the market */}
                    <button onClick={() => handleAcceptBid(vendorId)} style={{marginLeft: '10px'}}>
                        Accept Bid (Supplier Only)
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
