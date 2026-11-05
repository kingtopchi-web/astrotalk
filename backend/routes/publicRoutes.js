const express = require('express');
const router = express.Router();
const {
  getPublicExperts,
  getPublicExpertById,
  getPublicCategories,
  getPublicSubCategories,
  getPublicStats,
  getPublicSettings,
  globalSearch,
  notifyExpertConnect
} = require('../controllers/userController');
const { getTopReviews } = require('../controllers/reviewController');
const { submitContactForm } = require('../controllers/contactController');
const { getCategoryRequirements } = require('../controllers/documentController');

// Public Contact Form
router.post('/contact', submitContactForm);

// Public Global Search
router.get('/search', globalSearch);

// Public Expert Discovery
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);
router.post('/experts/:id/notify-connect', notifyExpertConnect);

// Public Stats & Settings
router.get('/stats', getPublicStats);
router.get('/settings', getPublicSettings);

// Public Testimonials (Dynamic Top-Rated Reviews)
router.get('/testimonials', getTopReviews);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);
router.get('/categories/:categoryId/document-requirements', getCategoryRequirements);
router.get('/document-requirements', getCategoryRequirements);

module.exports = router;

