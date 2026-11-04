const express = require('express');
const router = express.Router();
const adminRazorpayController = require('../controllers/adminRazorpayController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes in this router require authentication and ADMIN role
router.use(protect);
router.use(authorizeRoles('ADMIN'));

// Accounts & Settings
router.get('/accounts', adminRazorpayController.getAccounts);
router.put('/accounts', adminRazorpayController.updateSettings);
router.post('/accounts/:accountCode/test', adminRazorpayController.testConnection);

// Reporting
router.get('/reports', adminRazorpayController.getReports);

// Payouts
router.get('/payouts', adminRazorpayController.getPayouts);
router.post('/payouts/initiate', adminRazorpayController.initiateExpertPayout);
router.post('/payouts/:id/process', adminRazorpayController.processPayoutRequest);
router.post('/payouts/:id/reject', adminRazorpayController.rejectPayoutRequest);
router.put('/payouts/:id/bank-details', adminRazorpayController.updatePayoutBankDetails);

module.exports = router;

