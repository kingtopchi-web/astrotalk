const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getMyExpertProfile,
  updateMyExpertProfile,
  resubmitVerification,
  getDashboardStats,
  getConsultations,
  updateConsultationStatus,
  getEarnings,
  requestPayout
} = require('../controllers/expertController');

// All expert routes require authentication and EXPERT role
router.use(protect);
router.use(authorizeRoles('EXPERT'));

router.get('/profile', getMyExpertProfile);
router.get('/dashboard', getDashboardStats);
router.get('/earnings', getEarnings);
router.post('/payouts/request', requestPayout);
router.get('/consultations', getConsultations);
router.patch('/consultations/:id/status', updateConsultationStatus);
router.patch('/profile', updateMyExpertProfile);
router.post('/resubmit', resubmitVerification);

module.exports = router;
