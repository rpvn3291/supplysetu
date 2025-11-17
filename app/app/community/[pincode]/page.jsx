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

// --- NEW: Modal Component for Polls ---
const PollModal = ({ isOpen, onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(''); // Comma-separated string

  const handleSubmit = (e) => {
    e.preventDefault();
    const optionsArray = options.split(',').map(o => o.trim()).filter(o => o);
    if (question && optionsArray.length > 1) {
      onSubmit(question, optionsArray);
      setQuestion('');
      setOptions('');
      onClose();
    } else {
      alert("Please provide a question and at least two comma-separated options.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Start a New Poll</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Poll Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Options (comma-separated)</label>
            <input
              type="text"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="e.g., Yes, No, Maybe"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Start Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW: Modal Component for Bulk Orders ---
const BulkOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (productId && productName) {
      onSubmit(productId, productName);
      setProductId('');
      setProductName('');
      onClose();
    } else {
      alert("Please provide both a product ID and name.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Start a Bulk Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Product ID</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Fresh Tomatoes"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">
              Propose Bulk Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function ChatPage() {
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

  // --- NEW: State for modals ---
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isBulkOrderModalOpen, setIsBulkOrderModalOpen] = useState(false);

  const scrollToBottom = () => { /* ... existing code ... */ };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { /* ... existing code ... */ return; }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        setMyUserId(JSON.parse(jsonPayload).id);
    } catch(e) { console.error("Error decoding token:", e)}

    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, { auth: { token } });
    setSocket(newSocket);
    newSocket.emit('join_room', pincode);
    
    // --- Listeners (unchanged) ---
    newSocket.on('community_info', (data) => setCommunityInfo(data));
    newSocket.on('chat_history', (history) => setMessages(history));
    newSocket.on('receive_message', (message) => setMessages((prev) => [...prev, message]));
    newSocket.on('new_poll', (pollData) => setPoll(pollData));
    newSocket.on('poll_update', (pollData) => setPoll(pollData));
    newSocket.on('poll_error', (error) => alert(`Poll Error: ${error.message}`));
    newSocket.on('new_bulk_order', (boData) => setBulkOrder(boData));
    newSocket.on('bulk_order_update', (boData) => setBulkOrder(boData));
    newSocket.on('bulk_order_finalized', (data) => { alert(data.message); setBulkOrder(null); });
    newSocket.on('bulk_order_error', (error) => alert(`Bulk Order Error: ${error.message}`));

    return () => newSocket.disconnect();
  }, [pincode]);

  const handleSendMessage = (e) => { /* ... existing code ... */ };
  const handleVote = (option) => { /* ... existing code ... */ };

  // --- UPDATED: Modal submit handlers ---
  const handleSubmitPoll = (question, options) => {
    if (socket) {
      socket.emit('start_poll', { pincode, question, options });
    }
  };

  const handleSubmitBulkOrder = (productId, productName) => {
    if (socket) {
      socket.emit('start_bulk_order', { pincode, productId, productName });
    }
  };

  const [commitQty, setCommitQty] = useState('');
  const handleCommitToBulkOrder = (e) => { /* ... existing code ... */ };
  const handleFinalizeBulkOrder = () => { /* ... existing code ... */ };

  const isPresident = myUserId === communityInfo.presidentId;

  return (
    <> {/* Use Fragment to render modals outside the main div */}
      <div className="flex flex-col h-screen bg-gray-100 font-inter">
        {/* Header */}
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/community" className="text-blue-600 hover:underline text-sm sm:text-base">
              &larr; Change Pincode
            </Link>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Community: {pincode}</h1>
              <p className="text-xs text-gray-500">
                President: {communityInfo.presidentId ? `${communityInfo.presidentId.substring(0, 8)}...` : 'N/A'}
              </p>
            </div>
            <div className="w-24"></div> 
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow container mx-auto p-4 overflow-hidden flex flex-col gap-4">
          {/* Poll Display */}
          {poll && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow">
              {/* ... existing poll display JSX ... */}
            </div>
          )}
          
          {/* Bulk Order Display */}
          {bulkOrder && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow">
              {/* ... existing bulk order display JSX ... */}
            </div>
          )}

          {/* Chat Messages Area */}
          <div className="flex-grow bg-white rounded-lg shadow overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => {
              const isMyMessage = msg.userId === myUserId;
              const messageIsPresident = msg.isPresident;
              return (
                <div key={msg._id || index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  {/* ... existing message display JSX ... */}
                   <div className={`p-2 rounded-lg max-w-[70%] ${isMyMessage ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <p className={`text-xs font-semibold ${messageIsPresident ? 'text-red-600' : 'text-blue-600'}`}>
                          {isMyMessage ? 'You' : `${msg.userId.substring(0, 6)}...`} {messageIsPresident && '(President)'}
                          <span className="text-gray-400 font-normal ml-2">{formatTime(msg.createdAt)}</span>
                      </p>
                      <p className="text-sm text-gray-800">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Footer / Input Area */}
        <footer className="bg-white p-4 border-t sticky bottom-0 z-10">
          <div className="container mx-auto">
            {/* President Actions */}
            {isPresident && (
              <div className="flex gap-2 mb-2">
                {/* --- UPDATED: Buttons now open modals --- */}
                <button onClick={() => setIsPollModalOpen(true)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition">Start Poll</button>
                <button onClick={() => setIsBulkOrderModalOpen(true)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200 transition">Start Bulk Order</button>
              </div>
            )}
            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow">
                Send
              </button>
            </form>
          </div>
        </footer>
      </div>

      {/* --- NEW: Render Modals Outside Main Layout --- */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmit={handleSubmitPoll}
      />
      <BulkOrderModal
        isOpen={isBulkOrderModalOpen}
        onClose={() => setIsBulkOrderModalOpen(false)}
        onSubmit={handleSubmitBulkOrder}
      />
    </>
  );
}