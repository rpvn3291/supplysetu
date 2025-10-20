// filename: server.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import Community from './models/communityModel.js';
import Message from './models/messageModel.js';

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  }
});

const polls = {}; // In-memory poll storage

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token not provided'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.user.id})`);

  socket.on('join_room', async (pincode) => {
    const roomName = `pincode-${pincode}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);

    let community = await Community.findOne({ pincode });
    if (!community) {
      community = await new Community({ pincode, presidentId: socket.user.id }).save();
      console.log(`New community for pincode ${pincode}. President is ${socket.user.id}`);
    }
    
    // Fetch last 50 messages for this pincode and send to the user who just joined
    const recentMessages = await Message.find({ pincode }).sort({ createdAt: -1 }).limit(50);
    socket.emit('chat_history', recentMessages.reverse());
    socket.emit('community_info', { presidentId: community.presidentId });
  });

  socket.on('send_message', async ({ pincode, message }) => {
    const roomName = `pincode-${pincode}`;
    const community = await Community.findOne({ pincode });

    // Save message to the database
    const newMessage = await new Message({
      pincode,
      userId: socket.user.id,
      message,
    }).save();

    io.to(roomName).emit('receive_message', {
      ...newMessage.toObject(),
      isPresident: community?.presidentId === socket.user.id,
    });
  });

  // --- POLLING LOGIC (remains the same) ---
  socket.on('start_poll', async ({ pincode, question, options }) => {
    const roomName = `pincode-${pincode}`;
    const community = await Community.findOne({ pincode });

    if (community?.presidentId !== socket.user.id) {
      return socket.emit('poll_error', { message: 'Only the community president can start a poll.' });
    }
    
    polls[roomName] = { question, options: options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}), voters: [] };
    io.to(roomName).emit('new_poll', polls[roomName]);
  });
  
  socket.on('vote', ({ pincode, option }) => {
    const roomName = `pincode-${pincode}`;
    const poll = polls[roomName];
    if (poll && !poll.voters.includes(socket.user.id)) {
      poll.options[option]++;
      poll.voters.push(socket.user.id);
      io.to(roomName).emit('poll_update', poll);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Community service (real-time) running on port ${PORT}`);
});

