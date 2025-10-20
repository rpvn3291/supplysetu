// filename: models/reviewModel.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  targetUserId: { // The user being reviewed (Vendor or Supplier)
    type: String,
    required: true,
    index: true,
  },
  reviewerId: { // The user who wrote the review
    type: String,
    required: true,
  },
  orderId: { // The specific transaction this review is linked to
    type: String,
    required: true,
    unique: true, // A user can only review a specific order once
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
