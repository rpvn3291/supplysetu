// filename: controllers/cartController.js
import asyncHandler from 'express-async-handler';
import redis from '../config/redisClient.js';

// Redis Key Convention: cart:<userId>

/**
 * @desc    Get the user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cartKey = `cart:${userId}`;
  
  // HGETALL retrieves all fields and values from a hash in Redis
  const cart = await redis.hgetall(cartKey);
  
  // The cart from Redis is an object of { productId: quantity_string }.
  // We'll format it into a more useful array.
  const formattedCart = cart 
    ? Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity: parseInt(quantity, 10),
      }))
    : [];
    
  res.status(200).json(formattedCart);
});

/**
 * @desc    Add or update an item in the cart
 * @route   POST /api/cart
 * @access  Private
 */
const addItemToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error('Product ID and a positive quantity are required.');
  }
  
  const cartKey = `cart:${userId}`;
  
  // HINCRBY atomically increments the value of a hash field by a given number.
  // If the field doesn't exist, it's created. This handles both adding and updating.
  await redis.hincrby(cartKey, productId, quantity);

  res.status(200).json({ message: 'Item added to cart' });
});

/**
 * @desc    Remove an item from the cart
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
const removeItemFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const cartKey = `cart:${userId}`;

  // HDEL removes the specified field from a hash.
  const result = await redis.hdel(cartKey, productId);

  if (result === 0) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  res.status(200).json({ message: 'Item removed from cart' });
});

/**
 * @desc    Clear the entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cartKey = `cart:${userId}`;

    // DEL removes the entire key.
    await redis.del(cartKey);

    res.status(200).json({ message: 'Cart cleared' });
});


export {
  getCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
};
