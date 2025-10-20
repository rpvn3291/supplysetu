// filename: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes'); // Import the routes
const { errorHandler } = require('./middleware/errorHandler');
const { connectToRabbitMQ } = require('./amqp/connection');

// Connect to MongoDB and RabbitMQ
connectDB();
connectToRabbitMQ();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Reviews service is running...');
});

// --- THIS IS THE FIX ---
// Use the API routes
app.use('/api/reviews', reviewRoutes);

// Use the centralized error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Reviews service running on port ${PORT}`);
});

