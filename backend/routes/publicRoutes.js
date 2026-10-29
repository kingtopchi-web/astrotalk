const express = require('express');
const router = express.Router();
const {
  getPublicExperts,
  getPublicExpertById,
  getPublicCategories,
  getPublicSubCategories,
  getPublicStats,
  getPublicSettings,
  globalSearch
} = require('../controllers/userController');
const { getTopReviews } = require('../controllers/reviewController');
const { submitContactForm } = require('../controllers/contactController');

// Public Contact Form
router.post('/contact', submitContactForm);

// Public Global Search
router.get('/search', globalSearch);

// Public Expert Discovery
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);

// Public Stats & Settings
router.get('/stats', getPublicStats);
router.get('/settings', getPublicSettings);

// Public Testimonials (Dynamic Top-Rated Reviews)
router.get('/testimonials', getTopReviews);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);

module.exports = router;

