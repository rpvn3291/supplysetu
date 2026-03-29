/**
 * SUPPLY SETU - ORDER SERVICE ROUTES
 * * ARCHITECTURE:
 * - Mobile App: Vendor Exclusive (Creation, My Orders)
 * - Web Portal: Supplier Exclusive (Incoming Orders, Status Updates)
 */

const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getIncomingOrders, 
  getOrderById, 
  updateOrderStatus,
  getReadyOrders,
  collectOrder,
  deliverOrder,
  getOrderForDelivery,
  getActiveDeliveries
} = require('../controllers/orderController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');
const { isVendor } = require('../middleware/permissionMiddleware.js');

// IMPORTANT: Ensure this file exists and exports isSupplier correctly
const { isSupplier } = require('../middleware/isSupplier.js'); 
const { createPaymentOrder, verifyPaymentSignature } = require('../controllers/paymentController.js');

const router = express.Router();

// ==========================================
// 1. SPECIFIC GET ROUTES (Must come first)
// ==========================================

// Vendor: View their own order history (Mobile)
router.get('/myorders', authMiddleware, isVendor, getMyOrders);

// Supplier: View orders assigned to them (Web)
router.get('/incoming', authMiddleware, isSupplier, getIncomingOrders);

// Delivery App: Get ready orders
router.get('/ready', getReadyOrders);

// Delivery App: Get active deliveries (in transit)
router.get('/active-deliveries', getActiveDeliveries);


// ==========================================
// 1.5 PAYMENT ROUTES (Must come before dynamic IDs)
// ==========================================

// Shared: Create Razorpay Order
router.post('/create-payment', authMiddleware, createPaymentOrder);

// Shared: Verify Razorpay Signature
router.post('/verify-payment', authMiddleware, verifyPaymentSignature);

// ==========================================
// 2. ACTION ROUTES
// ==========================================

// Vendor: Place a new order (Mobile)
router.post('/', authMiddleware, isVendor, createOrder);

// Supplier: Update Order Status (Web)
// Uses CONFIRMED, SHIPPED, DELIVERED, etc.
router.put('/:id/status', authMiddleware, isSupplier, updateOrderStatus);

// Delivery App: Collect order
router.put('/:id/collect', collectOrder);

// Delivery App: Deliver order with OTP
router.put('/:id/deliver', deliverOrder);

// Delivery App: Get specific order
router.get('/:id/delivery', getOrderForDelivery);


// ==========================================
// 3. DYNAMIC ID ROUTES (Must come last)
// ==========================================

// Shared: View details of a specific order
// (Greedy route: handles anything after /api/orders/)
router.get('/:id', authMiddleware, getOrderById);


module.exports = router;