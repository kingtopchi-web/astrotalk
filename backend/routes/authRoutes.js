const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  reactivateUser, 
  forgotPassword, 
  resetPassword,
  sendAuthOtp,
  verifyOtpLogin,
  verifyOtpRegister,
  socialLogin,
  verifyGoogleToken
} = require('../controllers/userAuthController');
const { registerExpert, loginExpert, reactivateExpert } = require('../controllers/expertAuthController');
const { loginAdmin } = require('../controllers/adminAuthController');

// Passwordless OTP Auth & Social Auth
router.post('/send-otp', sendAuthOtp);
router.post('/verify-otp-login', verifyOtpLogin);
router.post('/verify-otp-register', verifyOtpRegister);
router.post('/social-login', socialLogin);
router.post('/google-verify', verifyGoogleToken);

router.post('/user/send-otp', sendAuthOtp);
router.post('/user/verify-otp-login', verifyOtpLogin);
router.post('/user/verify-otp-register', verifyOtpRegister);
router.post('/user/social-login', socialLogin);
router.post('/user/google-verify', verifyGoogleToken);

// User Auth (Traditional fallback preserved)
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/reactivate', reactivateUser);
router.post('/user/forgotpassword', forgotPassword);

// Expert Auth
router.post('/expert/register', registerExpert);
router.post('/expert/login', loginExpert);
router.post('/expert/reactivate', reactivateExpert);
router.post('/expert/forgotpassword', forgotPassword);

// Shared / Unified Password Reset Routes
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword/:token', resetPassword);
router.put('/resetpassword/:token', resetPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/reset-password/:token', resetPassword);

// Admin Auth (Login Only)
router.post('/admin/login', loginAdmin);

// Legacy routes for compatibility
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reactivate', reactivateUser);

module.exports = router;
