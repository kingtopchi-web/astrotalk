const express = require('express');
const router = express.Router();

const { registerUser, loginUser, forgotPassword } = require('../controllers/userAuthController');
const { registerExpert, loginExpert } = require('../controllers/expertAuthController');
const { loginAdmin } = require('../controllers/adminAuthController');

// User Auth
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/forgotpassword', forgotPassword);

// Expert Auth
router.post('/expert/register', registerExpert);
router.post('/expert/login', loginExpert);

// Admin Auth (Login Only)
router.post('/admin/login', loginAdmin);

// Legacy routes for compatibility (to not break the existing frontend completely before update)
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
