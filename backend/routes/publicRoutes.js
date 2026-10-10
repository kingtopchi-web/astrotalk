const express = require('express');
const router = express.Router();
const {
  getPublicExperts,
  getPublicExpertById,
  getPublicCategories,
  getPublicSubCategories
} = require('../controllers/userController');

// Public Expert Discovery
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);

module.exports = router;
