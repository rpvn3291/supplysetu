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

// Setup Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow frontend connection
    methods: ["GET", "POST"]
  }
});

// --- In-memory storage for real-time features ---
// Note: For production, consider storing polls and bulk orders in Redis or MongoDB
// to prevent data loss on server restart.
const polls = {}; // { roomName (pincode): { question, options: { 'Option A': 0, ... }, voters: [] } }
const bulkOrders = {}; // { roomName (pincode): { productId, productName, commitments: { userId: quantity }, total: 0 } }
const liveMarkets = {}; // { marketId (supplierId): { productId, productName, supplierId, currentPrice, bids: {}, timerId, startTime, duration } }

// --- Market Window Configuration (IST) ---
const MARKET_START_HOUR_IST = 6;  // 6 AM
const MARKET_END_HOUR_IST = 18; // 6 PM (exclusive, so up to 17:59:59)

// --- Socket.IO Middleware for Authentication ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error(`Authentication error: Token not provided for socket ${socket.id}`);
    return next(new Error('Authentication error: Token not provided'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error(`Authentication error: Invalid token for socket ${socket.id}`, err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = user; // Attach user payload (id, role, email) to the socket
    next();
  });
});

// --- Main Connection Handler ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

  // --- Send initial state on connection ---
  socket.emit('active_markets_list', Object.values(liveMarkets));

  // --- Community Chat Logic ---
  socket.on('join_room', async (pincode) => {
    const roomName = `pincode-${pincode}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined community room: ${roomName}`);

    try {
      let community = await Community.findOne({ pincode });
      if (!community) {
        // First user becomes president
        community = await new Community({ pincode, presidentId: socket.user.id }).save();
        console.log(`New community for pincode ${pincode}. President is ${socket.user.id}`);
      }
      
      // Fetch recent messages and send community info
      const recentMessages = await Message.find({ pincode }).sort({ createdAt: -1 }).limit(50);
      socket.emit('chat_history', recentMessages.reverse()); // Send oldest first
      socket.emit('community_info', { presidentId: community.presidentId });

      // Send current poll and bulk order if active in this room
      if (polls[roomName]) socket.emit('poll_update', polls[roomName]);
      if (bulkOrders[roomName]) socket.emit('bulk_order_update', bulkOrders[roomName]);

    } catch (error) {
        console.error(`Error joining room ${pincode} for user ${socket.id}:`, error);
        socket.emit('error_message', { message: 'Failed to join community room.' });
    }
  });

  socket.on('send_message', async ({ pincode, message }) => {
    const roomName = `pincode-${pincode}`;
    try {
      const community = await Community.findOne({ pincode });
      const newMessage = await new Message({
        pincode,
        userId: socket.user.id,
        message,
      }).save();

      // Broadcast message to everyone in the room
      io.to(roomName).emit('receive_message', {
        ...newMessage.toObject(), // Send the saved message object
        isPresident: community?.presidentId === socket.user.id,
      });
    } catch (error) {
        console.error(`Error sending message in room ${pincode} by user ${socket.id}:`, error);
        socket.emit('error_message', { message: 'Failed to send message.' });
    }
  });

  // --- Polling Logic ---
  socket.on('start_poll', async ({ pincode, question, options }) => {
    const roomName = `pincode-${pincode}`;
    try {
      const community = await Community.findOne({ pincode });
      if (community?.presidentId !== socket.user.id) {
        return socket.emit('poll_error', { message: 'Only the community president can start a poll.' });
      }
      if (polls[roomName]) {
         return socket.emit('poll_error', { message: 'A poll is already active in this community.' });
      }
      polls[roomName] = { question, options: options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}), voters: [] };
      io.to(roomName).emit('new_poll', polls[roomName]); // Broadcast the new poll
    } catch (error) {
       console.error(`Error starting poll in room ${pincode} by user ${socket.id}:`, error);
       socket.emit('poll_error', { message: 'Failed to start poll.' });
    }
  });

  socket.on('vote', ({ pincode, option }) => {
    const roomName = `pincode-${pincode}`;
    const poll = polls[roomName];
    if (poll && poll.options.hasOwnProperty(option) && !poll.voters.includes(socket.user.id)) {
      poll.options[option]++;
      poll.voters.push(socket.user.id);
      io.to(roomName).emit('poll_update', poll); // Broadcast updated results
    } else if (poll && poll.voters.includes(socket.user.id)) {
        socket.emit('poll_error', { message: 'You have already voted in this poll.' });
    }
  });

  // --- Bulk Order Logic ---
   socket.on('start_bulk_order', async ({ pincode, productId, productName }) => {
    const roomName = `pincode-${pincode}`;
    try {
        const community = await Community.findOne({ pincode });
        if (community?.presidentId !== socket.user.id) {
            return socket.emit('bulk_order_error', { message: 'Only the community president can start a bulk order.' });
        }
        if (bulkOrders[roomName]) {
             return socket.emit('bulk_order_error', { message: 'A bulk order is already active in this community.' });
        }
        bulkOrders[roomName] = { productId, productName, initiator: socket.user.id, commitments: {}, total: 0 };
        io.to(roomName).emit('new_bulk_order', bulkOrders[roomName]);
    } catch (error) {
        console.error(`Error starting bulk order in room ${pincode} by user ${socket.id}:`, error);
        socket.emit('bulk_order_error', { message: 'Failed to start bulk order.' });
    }
  });

   socket.on('commit_to_bulk_order', ({ pincode, quantity }) => {
    const roomName = `pincode-${pincode}`;
    const bulkOrder = bulkOrders[roomName];
    const userCommitment = parseInt(quantity, 10);

    if (bulkOrder && Number.isInteger(userCommitment) && userCommitment >= 0) { // Allow committing 0 to withdraw
      const oldQuantity = bulkOrder.commitments[socket.user.id] || 0;
      bulkOrder.commitments[socket.user.id] = userCommitment;
      bulkOrder.total = (bulkOrder.total - oldQuantity) + userCommitment;
      io.to(roomName).emit('bulk_order_update', bulkOrder);
    }
  });

   socket.on('finalize_bulk_order', async ({ pincode }) => {
    const roomName = `pincode-${pincode}`;
    const bulkOrder = bulkOrders[roomName];
    try {
        const community = await Community.findOne({ pincode });
        if (bulkOrder && community?.presidentId === socket.user.id) {
            console.log("Finalizing bulk order:", bulkOrder); // Log before deletion
            // TODO: Add logic here to send the finalized bulkOrder.commitments
            // to the Order service via RabbitMQ or direct API call.
            io.to(roomName).emit('bulk_order_finalized', { message: `Bulk order for ${bulkOrder.productName} finalized!`, details: bulkOrder });
            delete bulkOrders[roomName];
        } else {
             socket.emit('bulk_order_error', { message: 'Only the president can finalize the order.' });
        }
    } catch(error){
         console.error(`Error finalizing bulk order in room ${pincode} by user ${socket.id}:`, error);
         socket.emit('bulk_order_error', { message: 'Failed to finalize bulk order.' });
    }
  });

  // --- Live Market Logic (Global, Not Pincode Based) ---
  socket.on('start_market', ({ productId, productName, startingPrice }) => {
    const marketId = socket.user.id; // Supplier ID used as market ID

    // Time Check (IST)
    const now = new Date();
    const istOffsetMinutes = 330;
    const nowUtc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const nowIst = new Date(nowUtc.getTime() + (istOffsetMinutes * 60000));
    const currentHourIST = nowIst.getHours();

    console.log(`Attempt to start market by ${socket.user.id} at hour (IST): ${currentHourIST}`);

    if (currentHourIST < MARKET_START_HOUR_IST || currentHourIST >= MARKET_END_HOUR_IST) {
       return socket.emit('market_error', { message: `Market can only be started between ${MARKET_START_HOUR_IST}:00 and ${MARKET_END_HOUR_IST}:00 IST.` });
    }
    // End Time Check

    if (socket.user.role !== 'SUPPLIER') {
      return socket.emit('market_error', { message: 'Only suppliers can start a market.' });
    }
    if (liveMarkets[marketId]) {
      return socket.emit('market_error', { message: 'You already have an active market.' });
    }

    const MARKET_DURATION_MS = 10 * 60 * 1000; // 10 minutes duration

    liveMarkets[marketId] = {
      marketId, productId, productName, supplierId: socket.user.id,
      currentPrice: parseFloat(startingPrice) || 0, // Ensure it's a number
      bids: {}, // { userId: { bidAmount, userEmail } }
      startTime: Date.now(),
      duration: MARKET_DURATION_MS,
      timerId: setTimeout(() => {
        console.log(`Market ${marketId} timed out.`);
        io.emit('market_closed', { marketId }); // Announce globally
        delete liveMarkets[marketId];
      }, MARKET_DURATION_MS)
    };

    io.emit('new_market_started', liveMarkets[marketId]); // Announce globally
    console.log(`Market ${marketId} started by supplier ${socket.user.id} for ${productName}`);
  });

  socket.on('join_market', (marketId) => {
    // Check if market exists before joining
    if(liveMarkets[marketId]) {
        const marketRoom = `market-${marketId}`;
        socket.join(marketRoom);
        console.log(`User ${socket.id} joined market room: ${marketRoom}`);
        // Send current market state to the user who just joined
        socket.emit('market_update', liveMarkets[marketId]);
    } else {
        socket.emit('market_error', { message: 'Market not found or has already ended.' });
    }
  });

  socket.on('make_bid', ({ marketId, bidAmount }) => {
    const marketRoom = `market-${marketId}`;
    const market = liveMarkets[marketId];
    const bidValue = parseFloat(bidAmount);

    if (socket.user.role !== 'VENDOR' || !market || !Number.isFinite(bidValue) || bidValue <= 0) {
      return socket.emit('market_error', { message: 'Invalid bid.' });
    }
    // Optional: Add logic to check if bid is higher than current highest or starting price

    market.bids[socket.user.id] = { bidAmount: bidValue, userEmail: socket.user.email }; // Store user email too
    io.to(marketRoom).emit('market_update', market); // Broadcast update only within the market room
  });

  socket.on('accept_bid', ({ marketId, vendorId }) => {
      const marketRoom = `market-${marketId}`;
      const market = liveMarkets[marketId];

      if (market && market.supplierId === socket.user.id) { // Check if sender is the supplier
          const acceptedBid = market.bids[vendorId];
          if (acceptedBid) {
              console.log(`Supplier ${socket.user.id} accepted bid from ${vendorId} in market ${marketId}`);
              // Announce accepted bid within the market room
              io.to(marketRoom).emit('bid_accepted', {
                  message: `Supplier accepted bid of ₹${acceptedBid.bidAmount.toFixed(2)} from vendor ${acceptedBid.userEmail || vendorId.substring(0,6)+'...'}`,
                  vendorId: vendorId,
                  productId: market.productId,
                  price: acceptedBid.bidAmount
              });
              // Announce market closure globally
              io.emit('market_closed', { marketId });
              clearTimeout(market.timerId); // Stop the timer
              delete liveMarkets[marketId]; // Remove the market
          } else {
              socket.emit('market_error', { message: 'Selected vendor has not placed a bid.' });
          }
      } else if (market) {
          socket.emit('market_error', { message: 'Only the supplier who started the market can accept bids.' });
      }
  });

  // --- Disconnect Handler ---
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Optionally: Notify rooms if a user leaves (e.g., for user counts)
  });
});

// --- Start the Server ---
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Community service (real-time) running on port ${PORT}`);
});

