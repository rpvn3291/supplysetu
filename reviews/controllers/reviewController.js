// filename: controllers/reviewController.js
const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const { publishToQueue } = require('../amqp/connection');

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { targetUserId, orderId, rating, comment } = req.body;
  const reviewerId = req.user.id; // From the auth token

  // Check if a review for this order already exists
  const existingReview = await Review.findOne({ orderId });
  if (existingReview) {
    res.status(409); // Conflict
    throw new Error('A review for this order already exists.');
  }

  const review = await Review.create({
    targetUserId,
    reviewerId,
    orderId,
    rating,
    comment,
  });

  // After saving to DB, publish an event for the blockchain service
  try {
    publishToQueue('review.created', review.toObject());
  } catch (error) {
    // Log the error but don't fail the request, as the review was saved successfully.
    console.error('Failed to publish review.created event:', error);
  }

  res.status(201).json(review);
});

/**
 * @desc    Get all reviews for a specific user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getReviewsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const reviews = await Review.find({ targetUserId: userId }).sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

module.exports = {
  createReview,
  getReviewsForUser,
};
