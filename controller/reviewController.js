const ProductModel = require('../models/ProductModel');
const ReviewModel = require('../models/ReviewModel');
const OrderModel = require("../models/OrderModel");

const calculateAverageRating = async (productId) => {
    try {
        const product = await ProductModel.findById(productId).populate('reviews');
        if (product.reviews.length > 0) {
            const sum = product.reviews.reduce((total, review) => total + review.rating, 0);
            product.averageRating = sum / product.reviews.length;
        } else {
            product.averageRating = 0;
        }
        await product.save();
    } catch (error) {
        console.error('Error calculating average rating:', error.message);
        throw new Error('Failed to calculate average rating');
    }
};

const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: 'Rating and comment are required' });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let review = await ReviewModel.findOne({ product: productId, user: userId });

        if (review) {
            // Update existing review
            review.rating = rating;
            review.comment = comment;
            await review.save();

            // Update product reviews and recalculate average rating
            await calculateAverageRating(productId);

            return res.status(200).json({ success: true, message: 'Review updated successfully', review });
        }

        // Create a new review if none exists
        review = new ReviewModel({
            product: productId,
            user: userId,
            rating,
            comment
        });

        await review.save();

        product.reviews.push(review._id);
        await product.save();

        await calculateAverageRating(productId);

        res.status(201).json({ success: true, message: 'Review created successfully', review });
    } catch (error) {
        console.error('Error creating or updating review:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        // Fetch the reviews for the product
        const reviews = await ReviewModel.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        if (!reviews.length) {
            return res.status(404).json({ success: false, message: 'No reviews found for this product' });
        }

        // Check if the reviewer has bought the product and add 'verifiedPurchase' flag
        const reviewsWithVerification = await Promise.all(reviews.map(async (review) => {
            const order = await OrderModel.findOne({
                buyer: review.user._id,               // Check if the buyer matches the reviewer
                products: productId,                  // Check if the product was bought
                status: { $ne: 'Cancelled' }          // Exclude cancelled orders
            });

            return {
                ...review.toObject(),
                verifiedPurchase: !!order            // If an order is found, mark as a verified purchase
            };
        }));

        res.status(200).json({
            success: true,
            message: 'Fetched product reviews',
            reviews: reviewsWithVerification
        });
    } catch (error) {
        console.error('Error fetching reviews:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
};



const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (req.user.id !== review.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this review' });
        }

        await ProductModel.findByIdAndUpdate(review.product, {
            $pull: { reviews: reviewId }
        });

        await ReviewModel.findByIdAndDelete(reviewId);

        await calculateAverageRating(review.product);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};

const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: 'Rating and comment are required' });
        }

        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.user.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update this review' });
        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        await calculateAverageRating(review.product);

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Error updating review:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

const getReviewsCountThisMonth = async (req, res) => {
    try {
      // Get the current date
      const currentDate = new Date();
  
      // Get the first day of the current month (set date to 1)
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
      // Use Mongoose's countDocuments to count reviews created from the start of the month to the current date
      const reviewCount = await ReviewModel.countDocuments({
        createdAt: {
          $gte: firstDayOfMonth, // Greater than or equal to the start of the month
          $lte: currentDate      // Less than or equal to the current date
        }
      });
  
      // Send the count back as a response
      return res.status(200).json({
        success: true,
        count: reviewCount
      });
    } catch (error) {
      console.error('Error fetching review count:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching review count'
      });
    }
  };

module.exports = {
    createReview,
    getProductReviews,
    deleteReview,
    updateReview,
    getReviewsCountThisMonth
};
