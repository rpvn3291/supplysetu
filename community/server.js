// filename: server.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import Community from './models/communityModel.js';
import Message from './models/messageModel.js';
import Poll from './models/pollModel.js';
import BulkOrder from './models/bulkOrderModel.js';
import LiveMarket from './models/liveMarketModel.js';

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

// --- Market Window Configuration (IST) ---
const MARKET_START_HOUR_IST = 5;  // 5 AM
const MARKET_END_HOUR_IST = 7; // 7 AM (exclusive, so up to 06:59:59)
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3003";

// --- Background Job for Market Expiry ---
const checkMarketExpiry = async () => {
  try {
    const expiredMarkets = await LiveMarket.find({
      $expr: { $lt: [{ $add: ["$startTime", "$duration"] }, Date.now()] }
    });
    for (const market of expiredMarkets) {
      io.emit('market_closed', { marketId: market.marketId });
      await LiveMarket.findByIdAndDelete(market._id);
    }
  } catch (error) {
    console.error("Error checking market expiry:", error);
  }
};
setInterval(checkMarketExpiry, 60000); // Run every minute

// --- Socket.IO Middleware for Authentication ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error(`Authentication error: Token not provided for socket ${socket.id}`);
    return next(new Error('Authentication error: Token not provided'));
  }

  // Bypass for driver prototype
  if (token === "mock_token.eyJpZCI6ImRyaXZlcjEiLCJyb2xlIjoiRFJJVkVSIn0.mock_signature") {
    socket.user = { id: 'driver_1', role: 'DRIVER' };
    socket.token = token;
    return next();
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error(`Authentication error: Invalid token for socket ${socket.id}`, err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = user; // Attach user payload (id, role, email)
    socket.token = token; // Store token to pass downstream to Order Service
    next();
  });
});

// --- Main Connection Handler ---
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

  try {
    // --- Send active markets on connection ---
    const activeMarkets = await LiveMarket.find({});
    socket.emit('active_markets_list', activeMarkets);
  } catch(e) {
    console.error(e);
  }

  // --- Community Chat Logic ---
  socket.on('join_room', async (pincode) => {
    const roomName = `pincode-${pincode}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined community room: ${roomName}`);

    try {
      let community = await Community.findOne({ pincode });
      if (!community) {
        community = await new Community({ pincode, presidentId: socket.user.id }).save();
        console.log(`New community for pincode ${pincode}. President is ${socket.user.id}`);
      }
      
      const recentMessages = await Message.find({ pincode }).sort({ createdAt: -1 }).limit(50);
      socket.emit('chat_history', recentMessages.reverse()); 
      socket.emit('community_info', { presidentId: community.presidentId });

      const currentPoll = await Poll.findOne({ pincode });
      if (currentPoll) socket.emit('poll_update', currentPoll);

      const currentBulkOrder = await BulkOrder.findOne({ pincode });
      if (currentBulkOrder) socket.emit('bulk_order_update', currentBulkOrder);

    } catch (error) {
        console.error(`Error joining room ${pincode}:`, error);
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

      io.to(roomName).emit('receive_message', {
        ...newMessage.toObject(),
        isPresident: community?.presidentId === socket.user.id,
      });
    } catch (error) {
        console.error(`Error sending message:`, error);
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
      
      const existingPoll = await Poll.findOne({ pincode });
      if (existingPoll) {
         return socket.emit('poll_error', { message: 'A poll is already active in this community.' });
      }
      
      const optionsMap = options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
      const newPoll = await Poll.create({ pincode, question, options: optionsMap, voters: [] });
      
      io.to(roomName).emit('new_poll', newPoll);
    } catch (error) {
       console.error(`Error starting poll:`, error);
       socket.emit('poll_error', { message: 'Failed to start poll.' });
    }
  });

  socket.on('vote', async ({ pincode, option }) => {
    const roomName = `pincode-${pincode}`;
    try {
      const poll = await Poll.findOne({ pincode });
      if (!poll) return socket.emit('poll_error', { message: 'No active poll found.' });

      if (poll.voters.includes(socket.user.id)) {
        return socket.emit('poll_error', { message: 'You have already voted in this poll.' });
      }

      if (poll.options.get(option) === undefined) {
         return socket.emit('poll_error', { message: 'Invalid option.' });
      }

      poll.options.set(option, poll.options.get(option) + 1);
      poll.voters.push(socket.user.id);
      await poll.save();

      io.to(roomName).emit('poll_update', poll); 
    } catch(error) {
      console.error('Error voting in poll:', error);
    }
  });

  // --- Bulk Order Logic ---
   socket.on('start_bulk_order', async ({ pincode, productId, productName, supplierId }) => {
    const roomName = `pincode-${pincode}`;
    try {
        const community = await Community.findOne({ pincode });
        if (community?.presidentId !== socket.user.id) {
            return socket.emit('bulk_order_error', { message: 'Only the community president can start a bulk order.' });
        }

        const existingOrder = await BulkOrder.findOne({ pincode });
        if (existingOrder) {
             return socket.emit('bulk_order_error', { message: 'A bulk order is already active in this community.' });
        }
        
        const newOrder = await BulkOrder.create({ pincode, productId, productName, supplierId, initiator: socket.user.id, commitments: {}, total: 0 });
        io.to(roomName).emit('new_bulk_order', newOrder);
    } catch (error) {
        console.error(`Error starting bulk order:`, error);
        socket.emit('bulk_order_error', { message: 'Failed to start bulk order.' });
    }
  });

   socket.on('commit_to_bulk_order', async ({ pincode, quantity }) => {
    const roomName = `pincode-${pincode}`;
    const userCommitment = parseInt(quantity, 10);

    if (!Number.isInteger(userCommitment) || userCommitment < 0) return;

    try {
      const bulkOrder = await BulkOrder.findOne({ pincode });
      if (!bulkOrder) return;

      const oldQuantity = bulkOrder.commitments.get(socket.user.id) || 0;
      bulkOrder.commitments.set(socket.user.id, userCommitment);
      bulkOrder.total = (bulkOrder.total - oldQuantity) + userCommitment;
      
      await bulkOrder.save();
      io.to(roomName).emit('bulk_order_update', bulkOrder);
    } catch (error) {
      console.error('Error committing to bulk order:', error);
    }
  });

   socket.on('finalize_bulk_order', async ({ pincode, pricePerUnit }) => {
    const roomName = `pincode-${pincode}`;
    
    try {
        const community = await Community.findOne({ pincode });
        const bulkOrder = await BulkOrder.findOne({ pincode });

        if (bulkOrder && community?.presidentId === socket.user.id) {
            console.log("Finalizing bulk order from DB...");
            
            const orderPayload = {
              orderItems: [{ productId: bulkOrder.productId, quantity: bulkOrder.total, price: pricePerUnit || 100 }],
              totalPrice: (pricePerUnit || 100) * bulkOrder.total,
              supplierId: bulkOrder.supplierId || "unknown-supplier", 
              vendorLocationLat: 17.3850, // Default lat (e.g. Hyderabad)
              vendorLocationLon: 78.4867
            };

            const orderResponse = await global.fetch(`${ORDER_SERVICE_URL}/api/orders`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${socket.token}`
              },
              body: JSON.stringify(orderPayload)
            });

            if(!orderResponse.ok) {
              const err = await orderResponse.json();
              return socket.emit('bulk_order_error', { message: `Order submission failed: ${err.message}` });
            }

            await BulkOrder.findOneAndDelete({ pincode });
            io.to(roomName).emit('bulk_order_finalized', { message: `Bulk order for ${bulkOrder.productName} finalized successfully!` });
            
        } else {
             socket.emit('bulk_order_error', { message: 'Only the president can finalize the order or bulk order not found.' });
        }
    } catch(error){
         console.error(`Error finalizing bulk order:`, error);
         socket.emit('bulk_order_error', { message: 'Failed to finalize bulk order.' });
    }
  });

  // --- Live Market Logic (Live Selling Model) ---
  socket.on('start_market', async ({ productId, productName, price, stockQuantity }) => {
    const marketId = socket.user.id; 

    // Time Check (IST)
    const now = new Date();
    const nowIst = new Date(now.getTime() + (330 * 60000));
    const currentHourIST = nowIst.getHours();

    console.log(`Attempt to start market by ${socket.user.id} at hour (IST): ${currentHourIST}`);

    if (socket.user.role !== 'SUPPLIER') {
      return socket.emit('market_error', { message: 'Only suppliers can start a market.' });
    }
    
    try {
      const existingMarket = await LiveMarket.findOne({ marketId });
      if (existingMarket) {
        return socket.emit('market_error', { message: 'You already have an active market.' });
      }

      const MARKET_DURATION_MS = 10 * 60 * 1000; // 10 minutes duration

      const newMarket = await LiveMarket.create({
        marketId,
        productId,
        productName,
        supplierId: socket.user.id,
        price: parseFloat(price) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        startTime: Date.now(),
        duration: MARKET_DURATION_MS,
        purchases: []
      });

      io.emit('new_market_started', newMarket); 
      console.log(`Market ${marketId} started by supplier ${socket.user.id} for ${productName}`);
    } catch (error) {
       console.error(error);
       socket.emit('market_error', { message: 'Failed to start live market.' });
    }
  });

  socket.on('join_market', async (marketId) => {
    console.log(`Socket ${socket.id} requesting to join market: ${marketId}`);
    try {
      const market = await LiveMarket.findOne({ marketId });
      console.log(`Market findOne result for ${marketId}:`, market ? 'Found' : 'Not Found');
      if(market) {
          const marketRoom = `market-${marketId}`;
          socket.join(marketRoom);
          console.log(`User ${socket.id} joined market room: ${marketRoom}`);
          socket.emit('market_update', market);
      } else {
          socket.emit('market_error', { message: 'Market not found or has already ended.' });
      }
    } catch (error) {
      console.error(`Error finding market ${marketId}:`, error);
      socket.emit('market_error', { message: 'Internal server error while joining market.' });
    }
  });

  // Vendors purchasing items "buy now"
  socket.on('buy_product', async ({ marketId, quantity }) => {
    const marketRoom = `market-${marketId}`;
    const buyQuantity = parseInt(quantity, 10);

    if (socket.user.role !== 'VENDOR' || !Number.isInteger(buyQuantity) || buyQuantity <= 0) {
      return socket.emit('market_error', { message: 'Invalid purchase request.' });
    }

    try {
      const market = await LiveMarket.findOne({ marketId });
      if (!market) return socket.emit('market_error', { message: 'Market has ended.' });

      if (market.stockQuantity < buyQuantity) {
         return socket.emit('market_error', { message: `Only ${market.stockQuantity} left in stock.` });
      }

      // Hit Order Service directly!
      const orderPayload = {
        orderItems: [{ productId: market.productId, quantity: buyQuantity, price: market.price }],
        totalPrice: market.price * buyQuantity,
        supplierId: market.supplierId,
        vendorLocationLat: 17.3850, // Default lat (e.g. Hyderabad) for quick live purchases
        vendorLocationLon: 78.4867
      };

      const orderResponse = await global.fetch(`${ORDER_SERVICE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${socket.token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!orderResponse.ok) {
         const err = await orderResponse.json();
         return socket.emit('market_error', { message: `Order Service Failed: ${err.message}` });
      }

      // Successfully ordered! Deduct stock
      market.stockQuantity -= buyQuantity;
      market.purchases.push({ userId: socket.user.id, userEmail: socket.user.email, quantity: buyQuantity });
      await market.save();

      io.to(marketRoom).emit('market_purchase', {
        message: `${buyQuantity}x purchased by ${socket.user.email || socket.user.id.substring(0, 6)}!`,
        remainingStock: market.stockQuantity
      });
      io.to(marketRoom).emit('market_update', market);

      // Auto-close if sold out
      if (market.stockQuantity <= 0) {
        console.log(`Market ${marketId} sold out and closed.`);
        io.emit('market_closed', { marketId });
        await LiveMarket.findOneAndDelete({ marketId });
      }

    } catch (error) {
      console.error(error);
      socket.emit('market_error', { message: 'Purchase transaction failed.' });
    }
  });

  // --- GPS Tracking Logic ---
  socket.on('join_tracking_room', (orderId) => {
    const roomName = `track-${orderId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined tracking room: ${roomName}`);
  });

  socket.on('driver_location_update', ({ orderId, latitude, longitude }) => {
    const roomName = `track-${orderId}`;
    io.to(roomName).emit('location_update', { orderId, latitude, longitude, timestamp: new Date() });
  });

  // --- Disconnect Handler ---
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// --- Start the Server ---
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Community service (real-time) running on port ${PORT}`);
});
