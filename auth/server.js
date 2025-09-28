// filename: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Import CORS
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler'); // We will create this file next

const app = express();
const PORT = process.env.PORT || 3001;

// 2. Use CORS Middleware
// For development, this allows all origins.
app.use(cors());

// For production, you should be more specific:
// app.use(cors({
//   origin: 'https://your-nextjs-app-domain.com'
// }));


// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

// Use the Centralized Error Handler (must be LAST)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

