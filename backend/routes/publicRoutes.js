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

// Public Global Search
router.get('/search', globalSearch);

// Public Expert Discovery
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);

// Public Stats & Settings
router.get('/stats', getPublicStats);
router.get('/settings', getPublicSettings);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);

module.exports = router;

