// filename: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes'); // Make sure this is imported

// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Product service is running...');
});

// Use the product routes - THIS IS THE CRUCIAL LINE
app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});

