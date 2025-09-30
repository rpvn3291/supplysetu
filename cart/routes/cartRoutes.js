// filename: routes/cartRoutes.js
import express from 'express';
import {
  getCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require a user to be logged in, so we apply the middleware to all.
router.use(authMiddleware);

router.route('/')
  .get(getCart)
  .post(addItemToCart)
  .delete(clearCart);

router.route('/:productId')
  .delete(removeItemFromCart);

export default router;
