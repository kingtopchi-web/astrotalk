const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  updateMyProfile,
  getPublicExperts,
  getPublicExpertById,
  getPublicCategories,
  getPublicSubCategories,
  getSavedExperts,
  toggleSaveExpert
} = require('../controllers/userController');

// All user routes require authentication and USER role
router.use(protect);
router.use(authorizeRoles('USER'));

// Profile
router.get('/profile', getMyProfile);
router.patch('/profile', updateMyProfile);

// Saved Experts
router.get('/saved-experts', getSavedExperts);
router.post('/saved-experts/:id', toggleSaveExpert);

// Public Expert Discovery (still requires login)
router.get('/experts', getPublicExperts);
router.get('/experts/:id', getPublicExpertById);

// Categories (public, used for filtering)
router.get('/categories', getPublicCategories);
router.get('/categories/:categoryId/subcategories', getPublicSubCategories);

module.exports = router;
