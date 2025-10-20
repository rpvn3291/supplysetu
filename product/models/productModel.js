// filename: models/productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
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
      enum: ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Spices', 'Groceries', 'Disposables', 'Other'],
    },
    unit: {
      type: String,
      required: [true, 'Please specify the unit'],
    },
    stock: {
      type: Number,
      required: [true, 'Please provide the available stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    supplierId: {
      type: String,
      required: [true, 'A supplier ID is required'],
      index: true,
    },
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required for display'],
    },
    supplierLocationLat: {
      type: Number,
      required: [true, 'Supplier latitude is required for search'],
    },
    supplierLocationLon: {
      type: Number,
      required: [true, 'Supplier longitude is required for search'],
    },
    qualityRating: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    unitConversionFactor: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

