const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const cartController = require('../controllers/marketplaceCartController');
const orderController = require('../controllers/marketplaceOrderController');
const sellerController = require('../controllers/marketplaceSellerController');
const reviewController = require('../controllers/marketplaceReviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ─── PUBLIC BROWSING ENDPOINTS ──────────────────────────────────────────────
router.get('/home', marketplaceController.getHomeData);
router.get('/categories', marketplaceController.getCategories);
router.get('/products', marketplaceController.getProducts);
router.get('/products/:slugOrId', marketplaceController.getProductDetails);
router.get('/reviews/:productId', reviewController.getProductReviews);

// ─── BUYER CART & CHECKOUT (Requires Login as USER or EXPERT) ───────────────
router.use('/cart', protect, authorizeRoles('USER', 'EXPERT'));
router.get('/cart', cartController.getCart);
router.post('/cart/items', cartController.addToCart);
router.delete('/cart/items/:itemId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

router.post('/checkout', protect, authorizeRoles('USER', 'EXPERT'), orderController.checkout);
router.post('/verify-payment', protect, authorizeRoles('USER', 'EXPERT'), orderController.verifyPayment);
router.get('/purchases', protect, authorizeRoles('USER', 'EXPERT'), orderController.getMyPurchases);
router.get('/downloads/:orderId/:productId', protect, authorizeRoles('USER', 'EXPERT'), orderController.downloadProduct);
router.post('/reviews', protect, authorizeRoles('USER', 'EXPERT'), reviewController.addReview);

// ─── SELLER ENDPOINTS (Both USER and EXPERT can sell digital products) ──────
router.use('/seller', protect, authorizeRoles('USER', 'EXPERT'));
router.get('/seller/dashboard', sellerController.getSellerDashboard);
router.post('/seller/products', sellerController.addProduct);
router.put('/seller/products/:id', sellerController.editProduct);
router.delete('/seller/products/:id', sellerController.deleteProduct);

module.exports = router;

