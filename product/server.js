// filename: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { errorHandler } = require('./middleware/errorHandler');
// --- IMPORT THE NEW CONNECTION HELPERS ---
const { connectToRabbitMQ } = require('./amqp/connection'); 
const { connectAndConsume } = require('./amqp/orderConsumer');

// Connect to Databases and Message Bus
connectDB();
connectToRabbitMQ(); // <-- THIS IS THE NEW LINE TO ADD
connectAndConsume();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/products', productRoutes);

// Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});

