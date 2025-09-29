// filename: routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts, // <-- Make sure to import this new function
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSupplier } = require('../middleware/permissionMiddleware');

const router = express.Router();

// --- CORRECTED ROUTE ORDER ---

// General routes for all products
router.route('/')
  .get(getAllProducts)
  .post(authMiddleware, isSupplier, createProduct);

// Specific route for a supplier's own products
// This MUST be defined BEFORE the dynamic '/:id' route below
router.get('/myproducts', authMiddleware, isSupplier, getMyProducts);

// Dynamic route for a single product by its ID
// This now correctly comes AFTER the '/myproducts' route
router.route('/:id')
  .get(getProductById)
  .put(authMiddleware, isSupplier, updateProduct)
  .delete(authMiddleware, isSupplier, deleteProduct);

module.exports = router;

