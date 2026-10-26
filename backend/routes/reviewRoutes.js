const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public route to fetch reviews for an expert and top platform reviews
router.get('/top-reviews', reviewController.getTopReviews);
router.get('/expert/:expertId', reviewController.getExpertReviews);

// Protected routes for users
router.post('/', protect, authorizeRoles('USER'), reviewController.createReview);
router.get('/consultation/:consultationId', protect, authorizeRoles('USER'), reviewController.getConsultationReview);
router.get('/my-reviews', protect, authorizeRoles('USER'), reviewController.getMyReviews);

module.exports = router;
