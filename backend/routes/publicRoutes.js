const express = require('express');
const router = express.Router();
const {
  getPublicExperts,
  getPublicExpertById,
  getPublicCategories,
  getPublicSubCategories,
  getPublicStats
} = require('../controllers/userController');

// Public Expert Discovery
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);

// Public Stats
router.get('/stats', getPublicStats);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);

module.exports = router;
