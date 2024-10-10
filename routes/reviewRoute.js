const express = require('express');
const { createReview, getProductReviews, deleteReview, updateReview, getReviewsCountThisMonth } = require('../controller/reviewController');
const { requireSigninForReview, isAdmin, requireSignin } = require('../middleware/AuthMiddleware');

const router = express.Router();

//get review count
router.get('/reviewcount',getReviewsCountThisMonth);

// Add a review to a product
router.post('/product/:productId', requireSigninForReview, createReview);

// Get reviews for a product
router.get('/:productId', getProductReviews);

// Delete a review (optional, e.g., for admins)
router.delete('/review/:reviewId', requireSigninForReview, deleteReview);

// Update a review
router.put('/review/:reviewId', requireSigninForReview, updateReview);

module.exports = router;
