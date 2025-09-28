// filename: controllers/productController.js
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

const createProduct = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const productData = { ...req.body, supplierId };

  const product = await Product.create(productData);
  res.status(201).json(product);
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.status(200).json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.supplierId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('User not authorized to update this product');
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document
    runValidators: true,
  });

  res.status(200).json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.supplierId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('User not authorized to delete this product');
  }

  await Product.deleteOne({ _id: req.params.id });
  res.status(200).json({ message: 'Product removed' });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

