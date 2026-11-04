const express = require('express');
const router = express.Router();
const adminMarketplaceController = require('../controllers/adminMarketplaceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes require ADMIN authentication
router.use(protect);
router.use(authorizeRoles('ADMIN'));

// Products Moderation
router.get('/products', adminMarketplaceController.getAllProducts);
router.patch('/products/:id/status', adminMarketplaceController.updateProductStatus);

// Categories
router.get('/categories', adminMarketplaceController.getCategories);
router.post('/categories', adminMarketplaceController.createCategory);
router.put('/categories/:id', adminMarketplaceController.updateCategory);
router.delete('/categories/:id', adminMarketplaceController.deleteCategory);

// Orders & Refunds
router.get('/orders', adminMarketplaceController.getAllOrders);
router.post('/orders/:id/refund', adminMarketplaceController.refundOrder);

// Earnings & Ledger
router.get('/earnings', adminMarketplaceController.getEarningsOverview);

// Settings
router.get('/settings', adminMarketplaceController.getSettings);
router.put('/settings', adminMarketplaceController.updateSettings);

// Reviews Moderation
router.get('/reviews', adminMarketplaceController.getReviews);
router.patch('/reviews/:id/status', adminMarketplaceController.updateReviewStatus);

module.exports = router;

