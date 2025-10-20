// filename: app/community/[pincode]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [communityInfo, setCommunityInfo] = useState({ presidentId: null });
  const [poll, setPoll] = useState(null);
  const [socket, setSocket] = useState(null);
  const params = useParams();
  const { pincode } = params;

  // Effect to establish and manage the WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // Handle case where user is not logged in
      console.error("No auth token found. Cannot connect to chat.");
      return;
    }

    // Connect to the server, passing the token for authentication
    const newSocket = io(process.env.NEXT_PUBLIC_COMMUNITY_API_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    // Join the room for the specific pincode
    newSocket.emit('join_room', pincode);

    // --- Listen for events from the server ---
    newSocket.on('community_info', (data) => setCommunityInfo(data));
    newSocket.on('chat_history', (history) => setMessages(history));
    newSocket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    newSocket.on('new_poll', (pollData) => setPoll(pollData));
    newSocket.on('poll_update', (pollData) => setPoll(pollData));
    newSocket.on('poll_error', (error) => alert(error.message));

    // Cleanup on component unmount
    return () => newSocket.disconnect();
  }, [pincode]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send_message', { pincode, message: newMessage });
      setNewMessage('');
    }
  };
  
  const handleVote = (option) => {
    if (socket) {
      socket.emit('vote', { pincode, option });
    }
  };

  // --- Mock functions for President actions ---
  // In a real app, these would open a form
  const handleStartPoll = () => {
      const question = prompt("Enter poll question:");
      const optionsStr = prompt("Enter poll options, separated by commas (e.g., Yes,No,Maybe):");
      if (question && optionsStr) {
          const options = optionsStr.split(',').map(o => o.trim());
          socket.emit('start_poll', { pincode, question, options });
      }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Link href="/">&larr; Back to Home</Link>
      <h1>Community Chat for Pincode: {pincode}</h1>
      <p>Community President ID: {communityInfo.presidentId || 'N/A'}</p>

      {/* Poll Display */}
      {poll && (
        <div style={{ border: '2px solid blue', padding: '15px', margin: '20px 0' }}>
          <h3>Poll: {poll.question}</h3>
          {Object.entries(poll.options).map(([option, votes]) => (
            <div key={option}>
              <button onClick={() => handleVote(option)} style={{ marginRight: '10px' }}>Vote</button>
              {option}: {votes} votes
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
            <strong style={{ color: msg.isPresident ? 'red' : 'black' }}>
              {msg.userId.substring(0, 6)}...{msg.isPresident && ' (President)'}:
            </strong>
            <span> {msg.message}</span>
          </div>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ width: '80%', padding: '5px' }}
        />
        <button type="submit">Send</button>
      </form>
      
      {/* President Actions */}
       <div style={{marginTop: '20px'}}>
            <button onClick={handleStartPoll}>Start Poll (President Only)</button>
       </div>
    </div>
  );
}
