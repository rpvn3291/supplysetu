// filename: app/markets/[marketId]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

// --- Helper Hook for Countdown ---
const useCountdown = (endTime) => {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft(endTime - Date.now());
        }, 1000);
        return () => clearInterval(intervalId);
    }, [endTime, timeLeft]);

    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return timeLeft > 0 ? `${minutes}m ${seconds}s left` : "Market Closed";
};

export default function MarketDetailPage() {
  const [market, setMarket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [myBid, setMyBid] = useState('');
  const [message, setMessage] = useState('');
  const [myUserId, setMyUserId] = useState(null); // Get user ID
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const { marketId } = params;
  const bidsEndRef = useRef(null); // Ref to scroll bids

  // Determine market end time
  const marketEndTime = market ? market.startTime + market.duration : 0;
  const timeLeftString = useCountdown(marketEndTime);

  // Scroll bids to bottom
  const scrollToBottom = () => {
    bidsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
   useEffect(scrollToBottom, [market?.bids]); // Scroll when bids update


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !marketId) {
        setError("Invalid access. Please log in.");
        setIsLoading(false);
        return;
    }
     // Decode token locally
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setMyUserId(JSON.parse(jsonPayload).id);
    } catch(e) { console.error("Error decoding token:", e)}

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);
    setIsLoading(true);

    newSocket.emit('join_market', marketId);

    // Initial market state might come from an API call or first socket event
    // For now, we rely on 'market_update'
    
    newSocket.on('market_update', (marketData) => {
      setMarket(marketData);
      setIsLoading(false); // Stop loading once we have data
    });

    newSocket.on('market_closed', () => {
        setMessage('This market has ended.');
        setMarket(prev => prev ? { ...prev, closed: true } : null); // Mark as closed
        setIsLoading(false);
    });

    newSocket.on('bid_accepted', (data) => {
        alert(`Bid Accepted! ${data.message}`);
         setMessage(`Bid for ₹${data.price} accepted from Vendor ${data.vendorId.substring(0,6)}... Market closed.`);
         setMarket(prev => prev ? { ...prev, closed: true } : null);
    });
    
     newSocket.on('connect_error', (err) => {
        console.error("Socket connection error:", err.message);
        setError("Could not connect to the market service.");
        setIsLoading(false);
    });

    return () => newSocket.disconnect();
  }, [marketId]);

  const handleMakeBid = (e) => {
    e.preventDefault();
    const bidAmount = parseFloat(myBid);
    if (socket && market && !market.closed && bidAmount > 0 && bidAmount > (market.currentPrice || 0)) {
        // Simple validation: bid must be higher than current price if exists
      socket.emit('make_bid', { marketId, bidAmount });
      setMessage(`You bid ₹${bidAmount}`);
      setMyBid(''); // Clear input after bid
    } else if (bidAmount <= (market?.currentPrice || 0)) {
        setMessage('Your bid must be higher than the starting price.');
    }
  };

  const handleAcceptBid = (vendorId) => {
      if (socket && market && !market.closed && myUserId === market.supplierId) {
          socket.emit('accept_bid', { marketId, vendorId });
      } else {
          setMessage("Only the supplier can accept bids.");
      }
  };

  // --- Render Logic ---
  if (isLoading) {
       return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
             <p className="text-gray-600">Connecting to market...</p>
        </div>
    );
  }
   if (error) {
       return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Link href="/markets" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Markets</Link>
            <p className="text-center text-red-600 mt-10">Error: {error}</p>
        </div>
       );
   }
   // Handle case where market data hasn't arrived yet but loading is false (e.g., market closed before join)
   if (!market && !isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
                 <Link href="/markets" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Markets</Link>
                 <p className="text-center text-gray-500 mt-10">{message || "Market not found or has ended."}</p>
            </div>
        );
   }


  const isSupplier = myUserId === market?.supplierId;
  const isMarketClosed = market?.closed || timeLeftString === "Market Closed";

  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8">
       <div className="container mx-auto max-w-3xl bg-white rounded-lg shadow-xl p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <Link href="/markets" className="text-blue-600 hover:underline text-sm">
                    &larr; Back to Markets
                </Link>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isMarketClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {timeLeftString}
                </div>
            </div>

            {/* Market Info */}
            <div className="text-center mb-6">
                 <h1 className="text-3xl font-bold text-gray-800">{market.productName}</h1>
                 <p className="text-sm text-gray-500 mt-1">Market ID: {market.marketId.substring(0,8)}...</p>
                 <p className="text-lg text-green-700 font-semibold mt-2">Starting Price: ₹{market.currentPrice.toFixed(2)}</p>
                 {message && <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-blue-600'}`}>{message}</p>}
            </div>

            {/* Bidding Area (for Vendors) */}
            {!isSupplier && !isMarketClosed && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Place Your Bid</h3>
                    <form onSubmit={handleMakeBid} className="flex gap-3 items-center">
                         <div className="relative flex-grow">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                             <input
                                type="number"
                                step="0.01"
                                min={market.currentPrice + 0.01} // Bid must be higher
                                value={myBid}
                                onChange={(e) => setMyBid(e.target.value)}
                                placeholder={`Higher than ₹${market.currentPrice.toFixed(2)}`}
                                required
                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                             />
                        </div>
                        <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition shadow whitespace-nowrap">
                            Place Bid
                        </button>
                    </form>
                </div>
            )}
             {isMarketClosed && <p className="text-center text-red-600 font-semibold mb-6">Bidding is closed for this market.</p>}


            {/* List of Current Bids */}
            <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 sticky top-0 bg-white pb-2">Current Bids</h3>
                {Object.keys(market.bids).length === 0 ? (
                     <p className="text-sm text-gray-500">No bids placed yet.</p>
                 ) : (
                    // Sort bids highest first
                    Object.entries(market.bids)
                        .sort(([, a], [, b]) => b.bidAmount - a.bidAmount)
                        .map(([vendorId, bidInfo]) => (
                            <div key={vendorId} className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                                <span>
                                    Vendor ({bidInfo.userEmail?.split('@')[0] ?? vendorId.substring(0,6)}...):
                                    <span className="font-semibold text-green-700 ml-2">₹{bidInfo.bidAmount.toFixed(2)}</span>
                                </span>
                                {/* Accept button only shown to the supplier and if market is open */}
                                {isSupplier && !isMarketClosed && (
                                    <button
                                        onClick={() => handleAcceptBid(vendorId)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition shadow-sm"
                                    >
                                        Accept Bid
                                    </button>
                                )}
                            </div>
                        ))
                )}
                 {/* Dummy div to ensure scrollIntoView works */}
                 <div ref={bidsEndRef} />
            </div>
       </div>
    </div>
  );
}