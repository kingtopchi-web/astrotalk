const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);

// Account-aware Webhook routes (supports raw JSON)
router.post('/webhook', paymentController.webhook);
router.post('/webhook/:accountCode', paymentController.webhook);

module.exports = router;
