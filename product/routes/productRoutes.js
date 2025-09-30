// filename: routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductsBySupplier, // Import the new function
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSupplier } = require('../middleware/permissionMiddleware');

const router = express.Router();

// --- Routes ---

router.route('/')
  .get(getAllProducts)
  .post(authMiddleware, isSupplier, createProduct);

router.get('/myproducts', authMiddleware, isSupplier, getMyProducts);

// NEW: An internal-facing route for other services to use.
// It will be protected by the same auth middleware.
router.get('/supplier', authMiddleware, isSupplier, getProductsBySupplier);

router.route('/:id')
  .get(getProductById)
  .put(authMiddleware, isSupplier, updateProduct)
  .delete(authMiddleware, isSupplier, deleteProduct);

module.exports = router;

