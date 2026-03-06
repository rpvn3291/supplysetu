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
  updateOrderStatus 
} = require('../controllers/orderController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');
const { isVendor } = require('../middleware/permissionMiddleware.js');

// IMPORTANT: Ensure this file exists and exports isSupplier correctly
const { isSupplier } = require('../middleware/isSupplier.js'); 

const router = express.Router();

// ==========================================
// 1. SPECIFIC GET ROUTES (Must come first)
// ==========================================

// Vendor: View their own order history (Mobile)
router.get('/myorders', authMiddleware, isVendor, getMyOrders);

// Supplier: View orders assigned to them (Web)
router.get('/incoming', authMiddleware, isSupplier, getIncomingOrders);


// ==========================================
// 2. ACTION ROUTES
// ==========================================

// Vendor: Place a new order (Mobile)
router.post('/', authMiddleware, isVendor, createOrder);

// Supplier: Update Order Status (Web)
// Uses CONFIRMED, SHIPPED, DELIVERED, etc.
router.put('/:id/status', authMiddleware, isSupplier, updateOrderStatus);


// ==========================================
// 3. DYNAMIC ID ROUTES (Must come last)
// ==========================================

// Shared: View details of a specific order
// (Greedy route: handles anything after /api/orders/)
router.get('/:id', authMiddleware, getOrderById);


module.exports = router;