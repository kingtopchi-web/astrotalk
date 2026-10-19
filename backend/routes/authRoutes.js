const express = require('express');
const router = express.Router();

const { registerUser, loginUser, reactivateUser, forgotPassword } = require('../controllers/userAuthController');
const { registerExpert, loginExpert, reactivateExpert } = require('../controllers/expertAuthController');
const { loginAdmin } = require('../controllers/adminAuthController');

// User Auth
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/reactivate', reactivateUser);
router.post('/user/forgotpassword', forgotPassword);

// Expert Auth
router.post('/expert/register', registerExpert);
router.post('/expert/login', loginExpert);
router.post('/expert/reactivate', reactivateExpert);

// Admin Auth (Login Only)
router.post('/admin/login', loginAdmin);

// Legacy routes for compatibility
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reactivate', reactivateUser);

module.exports = router;
