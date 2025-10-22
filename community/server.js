// filename: server.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import Community from './models/communityModel.js';
import Message from './models/messageModel.js';

connectDB();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" } });

// --- In-memory storage for real-time features ---
const polls = {};
const bulkOrders = {};
// --- REFACTORED: liveMarkets are now global, keyed by a unique market ID (e.g., the supplier's ID) ---
const liveMarkets = {}; // { marketId: { productId, productName, supplierId, currentPrice, bids: {}, timerId } }

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);
  
  // --- This is new: On connection, send the list of all active markets ---
  socket.emit('active_markets_list', Object.values(liveMarkets));

  // --- Community Chat Logic (pincode-based, remains unchanged) ---
  socket.on('join_room', async (pincode) => {
    const roomName = `pincode-${pincode}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined community room: ${roomName}`);
    // ... (community/president and chat history logic remains the same)
  });
  socket.on('send_message', async ({ pincode, message }) => { /* ... existing code ... */ });
  // ... (poll and bulk order logic also remain unchanged)


  // --- REFACTORED: Live Market Logic is now global ---
  socket.on('start_market', ({ productId, productName, startingPrice }) => {
    // A supplier can only run one market at a time, so we use their ID as the market ID.
    const marketId = socket.user.id; 
    
    if (socket.user.role !== 'SUPPLIER') {
      return socket.emit('market_error', { message: 'Only suppliers can start a market.' });
    }
    if (liveMarkets[marketId]) {
      return socket.emit('market_error', { message: 'You already have an active market.' });
    }

    const MARKET_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    liveMarkets[marketId] = {
      marketId,
      productId,
      productName,
      supplierId: socket.user.id,
      currentPrice: startingPrice,
      bids: {}, // { userId: { bidAmount, userEmail: "..." } }
      timerId: setTimeout(() => {
        // Broadcast to everyone that this specific market has closed
        io.emit('market_closed', { marketId });
        delete liveMarkets[marketId];
      }, MARKET_DURATION_MS)
    };
    
    // Broadcast the NEW market to EVERYONE connected to the server
    io.emit('new_market_started', liveMarkets[marketId]);
    console.log(`Market ${marketId} started by supplier ${socket.user.id}`);
  });

  // --- NEW: Event for a vendor to join a specific market's room ---
  socket.on('join_market', (marketId) => {
    const marketRoom = `market-${marketId}`;
    socket.join(marketRoom);
    console.log(`User ${socket.id} joined market room: ${marketRoom}`);
  });

  socket.on('make_bid', ({ marketId, bidAmount }) => {
    const marketRoom = `market-${marketId}`;
    const market = liveMarkets[marketId];

    if (socket.user.role !== 'VENDOR' || !market) {
      return;
    }
    
    market.bids[socket.user.id] = { bidAmount, userEmail: socket.user.email };
    // Broadcast the updated market status ONLY to those in the market room
    io.to(marketRoom).emit('market_update', market);
  });
  
  socket.on('accept_bid', ({ marketId, vendorId }) => {
      const marketRoom = `market-${marketId}`;
      const market = liveMarkets[marketId];

      if (market && market.supplierId === socket.user.id) {
          const acceptedBid = market.bids[vendorId];
          if (acceptedBid) {
              // Announce the accepted bid to everyone in the market room
              io.to(marketRoom).emit('bid_accepted', {
                  message: `Supplier accepted bid of $${acceptedBid.bidAmount} from vendor ${vendorId.substring(0, 6)}...`,
                  vendorId: vendorId,
                  productId: market.productId,
                  price: acceptedBid.bidAmount
              });
              // Announce globally that the market is over
              io.emit('market_closed', { marketId });
              clearTimeout(market.timerId);
              delete liveMarkets[marketId];
          }
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

