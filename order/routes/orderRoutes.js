// filename: routes/orderRoutes.js
const express = require('express');
const { createOrder, getMyOrders, getIncomingOrders } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isVendor } = require('../middleware/permissionMiddleware');
const { isSupplier } = require('../middleware/isSupplier'); // You will need to create this middleware
const { validateRequest } = require('../middleware/validateRequest');
const { createOrderSchema } = require('../validation/orderSchemas');

const router = express.Router();

// --- Vendor Routes ---
router.get('/myorders', authMiddleware, isVendor, getMyOrders);
router.post('/', authMiddleware, isVendor, validateRequest(createOrderSchema), createOrder);

// --- Supplier Route ---
// This is the new endpoint for suppliers to see their incoming orders
router.get('/incoming', authMiddleware, isSupplier, getIncomingOrders);

module.exports = router;

