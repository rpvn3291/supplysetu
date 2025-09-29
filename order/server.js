// filename: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// No longer need to import connectDB
const orderRoutes = require('./routes/orderRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/orders', orderRoutes);

// Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});

