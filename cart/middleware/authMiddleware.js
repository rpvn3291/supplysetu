// filename: middleware/authMiddleware.js
// This middleware is essential to identify which user's cart we are modifying.
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // We only need the user's ID to identify their cart.
      req.user = { id: decoded.id }; 
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { authMiddleware };
