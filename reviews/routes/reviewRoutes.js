// filename: routes/reviewRoutes.js
const express = require('express');
const { createReview, getReviewsForUser } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create a new review (requires user to be logged in)
router.post('/', authMiddleware, createReview);

// Route to get all reviews for a specific user (public)
router.get('/user/:userId', getReviewsForUser);

module.exports = router;
