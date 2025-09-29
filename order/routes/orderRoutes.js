// filename: routes/orderRoutes.js
const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isVendor } = require('../middleware/permissionMiddleware');
const { validateRequest } = require('../middleware/validateRequest'); // Assuming you create this file
const { createOrderSchema } = require('../validation/orderSchemas');

const router = express.Router();

// Get all orders for the logged-in vendor
router.get('/myorders', authMiddleware, isVendor, getMyOrders);

// Create a new order
router.post('/', authMiddleware, isVendor, validateRequest(createOrderSchema), createOrder);

module.exports = router;
