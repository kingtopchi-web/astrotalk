const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, walletController.getWallet);
router.get('/transactions', protect, walletController.getTransactions);
router.post('/add-money', protect, walletController.addMoney);
router.post('/verify-payment', protect, walletController.verifyPayment);
router.post('/pay-consultation', protect, walletController.payConsultation);

module.exports = router;
