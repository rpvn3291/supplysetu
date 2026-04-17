// filename: app/community/[pincode]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

// --- Helper to format time ---
const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 h-screen font-mono">
          <h1 className="text-2xl font-bold mb-4">React Crashed!</h1>
          <p className="whitespace-pre-wrap">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Hard Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatPageInternal />
    </ErrorBoundary>
  )
}

function ChatPageInternal() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [communityInfo, setCommunityInfo] = useState({ presidentId: null });
  const [poll, setPoll] = useState(null);
  const [bulkOrder, setBulkOrder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const params = useParams();
  const { pincode } = params;
  const messagesEndRef = useRef(null);

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [bulkOrderProduct, setBulkOrderProduct] = useState('');
  const [bulkOrderProductId, setBulkOrderProductId] = useState('');
  const [bulkOrderSupplierId, setBulkOrderSupplierId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [commitQty, setCommitQty] = useState('');
  const [debugLog, setDebugLog] = useState('Init');

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { 
        setDebugLog(prev => prev + ' -> NO TOKEN FOUND IN LOCALSTORAGE');
        return; 
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        setMyUserId(JSON.parse(jsonPayload).id);
        setDebugLog(prev => prev + ' -> Token Decoded');
    } catch(e) { 
        console.error("Error decoding token:", e);
        setDebugLog(prev => prev + ' -> Token Decode Error: ' + e.message);
    }

    const apiUrl = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || 'http://localhost:3005';
    setDebugLog(prev => prev + ' -> Connecting to ' + apiUrl + ' with pincode: ' + String(pincode));

    const newSocket = io(apiUrl, { auth: { token }, transports: ['websocket'] }); // Force websocket to bypass generic HTTP CORS issues if any
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
        setDebugLog(prev => prev + ' -> Socket Connected!');
        newSocket.emit('join_room', String(pincode));
    });

    newSocket.on('connect_error', (err) => {
        setDebugLog(prev => prev + ' -> Socket Error: ' + err.message);
    });
    
    newSocket.on('community_info', (data) => setCommunityInfo(data));
    newSocket.on('chat_history', (history) => {
        setDebugLog(prev => prev + ' -> History Received (' + (history?.length || 0) + ')');
        setMessages(Array.isArray(history) ? history : []);
    });
    newSocket.on('error_message', (err) => {
        setDebugLog(prev => prev + ' -> SERVER ERROR: ' + err.message);
    });
    newSocket.on('receive_message', (message) => setMessages((prev) => Array.isArray(prev) ? [...prev, message] : [message]));
    newSocket.on('new_poll', (pollData) => setPoll(pollData));
    newSocket.on('poll_update', (pollData) => setPoll(pollData));
    newSocket.on('poll_error', (error) => alert(`Poll Error: ${error.message}`));
    newSocket.on('new_bulk_order', (boData) => setBulkOrder(boData));
    newSocket.on('bulk_order_update', (boData) => setBulkOrder(boData));
    newSocket.on('bulk_order_finalized', (data) => { alert(data.message); setBulkOrder(null); });
    newSocket.on('bulk_order_error', (error) => alert(`Bulk Order Error: ${error.message}`));

    return () => newSocket.disconnect();
  }, [pincode]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send_message', { pincode, message: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleVote = (option) => {
    if (socket) socket.emit('vote', { pincode, option });
  };

  const handleCommitToBulkOrder = () => {
      if(socket && commitQty) {
          socket.emit('commit_to_bulk_order', { pincode, quantity: parseInt(commitQty, 10) });
          setCommitQty('');
      }
  };

  const handleStartPoll = () => {
      if(socket && pollQuestion && pollOptions) {
          const optionsArr = pollOptions.split(',').map(o => o.trim()).filter(o => o);
          socket.emit('start_poll', { pincode, question: pollQuestion, options: optionsArr });
          setPollQuestion(''); setPollOptions('');
      }
  };

  const handleSearchProducts = async (text) => {
      setBulkOrderProduct(text);
      setBulkOrderProductId('');
      setBulkOrderSupplierId('');
      if (!text) { setSearchResults([]); return; }
      try {
          const res = await fetch(`/api/products?search=${text}`);
          const data = await res.json();
          setSearchResults(data.products || []);
      } catch(e) { console.error(e); }
  };

  const selectProduct = (p) => {
      setBulkOrderProduct(p.name);
      setBulkOrderProductId(p._id);
      setBulkOrderSupplierId(p.supplierId);
      setSearchResults([]);
  };

  const handleStartBulkOrder = () => {
      if(socket && bulkOrderProduct && bulkOrderProductId && bulkOrderSupplierId) {
          socket.emit('start_bulk_order', { pincode, productId: bulkOrderProductId, productName: bulkOrderProduct, supplierId: bulkOrderSupplierId });
          setBulkOrderProduct(''); setBulkOrderProductId(''); setBulkOrderSupplierId('');
      } else if (socket && bulkOrderProduct) {
          alert("Please select a valid product from the dropdown list.");
      }
  };

  const handleFinalizeBulkOrder = () => {
      if(socket) {
          socket.emit('finalize_bulk_order', { pincode, pricePerUnit: 100 });
      }
  };

  const isPresident = Boolean(myUserId) && communityInfo && myUserId === communityInfo.presidentId;

  return (
      <div className="flex flex-col h-screen bg-gray-100 font-inter">
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
            <Link href="/community" className="text-blue-600 hover:underline text-sm sm:text-base">&larr; Change Pincode</Link>
            <div className="text-center my-2 sm:my-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pincode {pincode} Hub</h1>
              {isPresident && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-bold">President</span>}
            </div>
            <div className="text-xs text-red-500 font-mono w-full sm:w-1/3 overflow-hidden text-right">Debug: {debugLog}</div> 
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 overflow-hidden flex flex-col gap-4">
          
          <div className="flex-grow bg-white rounded-lg shadow overflow-y-auto p-4 space-y-3">
             {/* Widgets Area at Top of Chat */}
             {poll && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow mb-4">
                    <h3 className="font-bold text-blue-800 mb-2">📊 Community Poll: {poll.question}</h3>
                    <div className="space-y-2">
                    {Object.keys(poll.options || {}).map(key => (
                        <button key={key} onClick={() => handleVote(key)} className="w-full text-left bg-white px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex justify-between">
                            <span className="font-semibold text-gray-700">{key}</span>
                            <span className="text-blue-600 font-bold">{poll.options && poll.options[key] ? poll.options[key] : 0} votes</span>
                        </button>
                    ))}
                    </div>
                </div>
            )}
            
            {bulkOrder && (
                <div className="bg-green-50 border border-green-400 rounded-lg p-4 shadow mb-4">
                    <h3 className="font-bold text-green-700 mb-1">📦 Active Bulk Order: {bulkOrder.productName}</h3>
                    <p className="text-gray-600 mb-3">Total Pledged: {bulkOrder.total} units</p>
                    <div className="flex gap-2 mb-3">
                        <input type="number" placeholder="Qty" value={commitQty} onChange={(e) => setCommitQty(e.target.value)} className="w-20 px-2 py-1 border rounded" />
                        <button onClick={handleCommitToBulkOrder} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 font-medium">Pledge</button>
                    </div>
                    {isPresident && (
                        <button onClick={handleFinalizeBulkOrder} className="w-full bg-yellow-500 text-white font-bold py-2 rounded hover:bg-yellow-600 transition">FINALIZE & PLACE BIG ORDER</button>
                    )}
                </div>
            )}

            {isPresident && !poll && !bulkOrder && (
                <div className="bg-yellow-100 border border-yellow-500 rounded-lg p-4 shadow mb-4">
                    <h3 className="font-bold text-yellow-800 mb-3">President Tools</h3>
                    
                    <div className="mb-4">
                        <input type="text" placeholder="Poll Question" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="w-full p-2 mb-2 border border-yellow-500 rounded" />
                        <input type="text" placeholder="Options (comma separated)" value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} className="w-full p-2 mb-2 border border-yellow-500 rounded" />
                        <button onClick={handleStartPoll} className="w-full bg-yellow-500 text-white font-bold py-2 rounded">Start Poll</button>
                    </div>

                    <div className="relative">
                        <input type="text" placeholder="Search Product for Bulk Order..." value={bulkOrderProduct} onChange={(e) => handleSearchProducts(e.target.value)} className="w-full p-2 mb-2 border border-green-500 rounded" />
                        {searchResults.length > 0 && (
                            <div className="absolute top-10 w-full max-h-40 overflow-y-auto bg-white border border-yellow-600 rounded shadow-lg z-20">
                                {searchResults.map(p => (
                                    <button key={p._id} onClick={() => selectProduct(p)} className="block w-full text-left p-2 border-b hover:bg-gray-100">
                                        <div className="font-bold">{p.name}</div>
                                        <div className="text-xs text-gray-500">Supplier: {p.supplierName} - ₹{p.price}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={handleStartBulkOrder} className="w-full bg-green-600 text-white font-bold py-2 rounded">Start Bulk Order</button>
                    </div>
                </div>
            )}

            {/* Chat History */}
            {Array.isArray(messages) && messages.map((msg, index) => {
              const isMyMessage = msg.userId === myUserId;
              return (
                <div key={msg._id || index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                   <div className={`p-2 rounded-lg max-w-[70%] ${isMyMessage ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300'}`}>
                      {!isMyMessage && <p className={`text-xs font-bold mb-1 ${msg.isPresident ? 'text-red-500' : 'text-gray-500'}`}>{msg.isPresident ? '👑 President' : 'Vendor'}</p>}
                      <p className={`text-sm ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white p-4 border-t sticky bottom-0 z-10 w-full">
          <div className="container mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input disabled={!socket} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={socket ? "Type your message..." : "Waiting for connection / Login Required..."} className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400" />
              <button disabled={!socket} type="submit" className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition shadow disabled:bg-gray-400">Send</button>
            </form>
          </div>
        </footer>
      </div>
  );
}