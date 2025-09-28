// filename: models/productModel.js
const mongoose = require('mongoose');

// Define the structure of a product in the database
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true, // Removes whitespace from both ends
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a product category'],
      enum: ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Paper Goods', 'Other'], // Pre-defined categories
    },
    unit: {
      type: String,
      required: [true, 'Please specify the unit (e.g., kg, dozen, pack)'],
      default: 'kg',
    },
    stock: {
      type: Number,
      required: [true, 'Please provide the available stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      required: false, // Optional for now
    },
    supplierId: {
      type: String, // We'll store the user ID from the JWT
      required: [true, 'A supplier ID is required'],
    },
  },
  {
    // Automatically add `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// Create the Product model from the schema
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
