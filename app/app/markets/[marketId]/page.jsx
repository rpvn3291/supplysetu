// filename: app/markets/[marketId]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

const useCountdown = (endTime) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!endTime) return;
        
        const updateTimer = () => setTimeLeft(endTime - Date.now());
        updateTimer(); // Initial update when endTime loads

        const intervalId = setInterval(() => {
            if (endTime - Date.now() <= 0) {
                clearInterval(intervalId);
            }
            updateTimer();
        }, 1000);

        return () => clearInterval(intervalId);
    }, [endTime]);

    if (!endTime) return "Loading...";
    if (timeLeft <= 0) return "Market Closed";

    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return `${minutes}m ${seconds}s left`;
};

export default function MarketDetailPage() {
  const [market, setMarket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [buyQty, setBuyQty] = useState('1');
  const [message, setMessage] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const { marketId } = params;
  const purchasesEndRef = useRef(null);

  const marketEndTime = market ? new Date(market.startTime).getTime() + market.duration : 0;
  const timeLeftString = useCountdown(marketEndTime);

  const scrollToBottom = () => {
    purchasesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [market?.purchases]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !marketId) {
        setError("Invalid access. Please log in.");
        setIsLoading(false);
        return;
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setMyUserId(JSON.parse(jsonPayload).id);
    } catch(e) {}

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL || 'http://localhost:3005', {
      auth: { token }
    });
    setSocket(newSocket);
    setIsLoading(true);

    newSocket.emit('join_market', marketId);

    newSocket.on('market_update', (marketData) => {
      setMarket(marketData);
      setIsLoading(false);
    });

    newSocket.on('market_closed', () => {
        setMessage('This market has ended or sold out.');
        setMarket(prev => prev ? { ...prev, closed: true } : null);
        setIsLoading(false);
    });

    newSocket.on('market_purchase', (data) => {
         setMessage(`Notification: ${data.message}`);
    });

    newSocket.on('market_error', (data) => {
        setMessage(`Error: ${data.message}`);
        setError(`Error: ${data.message}`);
        setIsLoading(false);
    });
    
     newSocket.on('connect_error', (err) => {
        setError(`WebSocket Connection Failed: ${err.message}. Please click the browser refresh button.`);
        setIsLoading(false);
    });

    return () => newSocket.disconnect();
  }, [marketId]);

  const handleBuy = (e) => {
    e.preventDefault();
    const qty = parseInt(buyQty, 10);
    if (socket && market && !market.closed && qty > 0) {
      if (qty > market.stockQuantity) {
          setMessage(`Cannot buy more than ${market.stockQuantity} items.`);
          return;
      }
      socket.emit('buy_product', { marketId, quantity: qty });
      setBuyQty('1');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen p-8 text-red-600">{error}</div>;
  if (!market) return <div className="min-h-screen p-8 text-gray-500">Market not found or has ended.</div>;

  const isSupplier = myUserId === market?.supplierId;
  const isMarketClosed = market?.closed || timeLeftString === "Market Closed" || market.stockQuantity <= 0;

  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8">
       <div className="container mx-auto max-w-3xl bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <Link href="/markets" className="text-blue-600 hover:underline text-sm">&larr; Back to Markets</Link>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isMarketClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {isMarketClosed ? "Closed" : timeLeftString}
                </div>
            </div>

            <div className="text-center mb-6">
                 <span className="text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-100 px-3 py-1 rounded-full animate-pulse shadow-sm border border-red-200">● LIVE SELLING</span>
                 <h1 className="text-3xl font-bold text-gray-800 mt-4">{market.productName}</h1>
                 <p className="text-sm text-gray-500 mt-1">Market ID: {market.marketId.substring(0,8)}...</p>
                 <div className="mt-4 flex justify-center gap-6">
                    <p className="text-xl text-green-700 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">Price: ₹{market.price.toFixed(2)}</p>
                    <p className="text-xl text-blue-700 font-bold bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">Stock: {market.stockQuantity}</p>
                 </div>
                 {message && <p className={`mt-4 font-semibold text-sm ${message.includes('Error') ? 'text-red-600' : 'text-blue-600'}`}>{message}</p>}
            </div>

            {!isSupplier && !isMarketClosed && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Buy Now</h3>
                    <form onSubmit={handleBuy} className="flex gap-3 items-center">
                         <div className="relative flex-grow">
                             <input type="number" step="1" min="1" max={market.stockQuantity} value={buyQty} onChange={(e) => setBuyQty(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                        </div>
                        <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition shadow whitespace-nowrap">
                            Buy @ ₹{market.price.toFixed(2)}
                        </button>
                    </form>
                </div>
            )}
            
            {isMarketClosed && <p className="text-center text-red-600 font-semibold mb-6">This market session is over.</p>}

            <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50 flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 sticky top-0 bg-gray-50 pb-2 z-10 border-b border-gray-200">Live Purchases</h3>
                {!market.purchases || market.purchases.length === 0 ? (
                     <p className="text-sm text-gray-500 italic">No purchases yet...</p>
                 ) : (
                    market.purchases.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white border border-gray-100 rounded shadow-sm text-sm">
                            <span className="font-medium text-gray-800">
                                Vendor <span className="text-blue-600">{(p.userEmail?.split('@')[0] || p.userId.substring(0,6))}</span> bought <span className="font-bold text-green-700">{p.quantity}x</span>
                            </span>
                            <span className="text-xs text-gray-400">{new Date(p.purchasedAt).toLocaleTimeString()}</span>
                        </div>
                    ))
                )}
                 <div ref={purchasesEndRef} />
            </div>
       </div>
    </div>
  );
}