// filename: server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cartRoutes from './routes/cartRoutes.js'; 
import { errorHandler } from './middleware/errorHandler.js';
import redis from './config/redisClient.js';

// Test Redis connection on startup
(async () => {
    try {
        const pong = await redis.ping();
        console.log(`Connected to Redis: ${pong}`);
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
    res.send('Cart service is running...');
});

// --- THIS IS THE FIX ---
// Activate the API routes and the error handler
app.use('/api/cart', cartRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Cart service running on port ${PORT}`);
});

