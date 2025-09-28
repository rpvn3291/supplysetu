// filename: routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSupplier } = require('../middleware/permissionMiddleware');
const { validateRequest } = require('../middleware/validateRequest'); // Import validator
const { createProductSchema, updateProductSchema } = require('../validation/productSchemas'); // Import schemas

const router = express.Router();

router.route('/')
  .get(getAllProducts)
  .post(
    authMiddleware,
    isSupplier,
    validateRequest(createProductSchema), // Add validation here
    createProduct
  );

router.route('/:id')
  .get(getProductById)
  .put(
    authMiddleware,
    isSupplier,
    validateRequest(updateProductSchema), // Add validation here
    updateProduct
  )
  .delete(authMiddleware, isSupplier, deleteProduct);

module.exports = router;

