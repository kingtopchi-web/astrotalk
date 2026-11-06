const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, walletController.getWallet);
router.get('/transactions', protect, walletController.getTransactions);
router.get('/coupons', protect, couponController.getAvailableCoupons);
router.post('/apply-coupon', protect, couponController.applyCoupon);
router.post('/redeem-voucher', protect, couponController.redeemVoucher);
router.post('/add-money', protect, walletController.addMoney);
router.post('/verify-payment', protect, walletController.verifyPayment);
router.post('/pay-consultation', protect, walletController.payConsultation);
router.post('/pay-call-wallet', protect, walletController.payCallWithWallet);
router.post('/create-call-order', protect, walletController.createCallOrder);
router.post('/verify-call-payment', protect, walletController.verifyCallPayment);

module.exports = router;
