const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getExperts,
  getExpertById,
  approveExpert,
  rejectExpert,
  approveExpertBankDetails,
  rejectExpertBankDetails,
  updateExpertStatus,
  deleteExpert,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  getAdminProfile,
  updateAdminProfile,
  getSidebarStats,
  getAllConsultations,
  getAllPayments,
  getConsultationById,
  updateConsultationStatus,
  getConsultationStats,
  getAllTransactions,
  getRevenue,
  getSettings,
  updateSettings,
  globalSearch,
  getAdministrators,
  createAdministrator,
  updateAdministratorStatus,
  updateAdministratorPassword,
  deleteAdministrator,
  sendBroadcastNotification,
  getBroadcastHistory
} = require('../controllers/adminController');

const {
  getAdminDocumentRequirements,
  createDocumentRequirement,
  updateDocumentRequirement,
  deleteDocumentRequirement,
  getExpertDocumentsForAdmin,
  verifyExpertDocument,
  rejectExpertDocument,
  requestDocumentReupload,
  updateDocumentAdminNotes
} = require('../controllers/documentController');

// All routes require authentication and ADMIN role
router.use(protect);
router.use(authorizeRoles('ADMIN'));

// Global Search
router.get('/global-search', globalSearch);

// Profile
router.get('/profile', getAdminProfile);
router.patch('/profile', updateAdminProfile);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Administrators Management
router.get('/administrators', getAdministrators);
router.post('/administrators', createAdministrator);
router.patch('/administrators/:id/status', updateAdministratorStatus);
router.patch('/administrators/:id/password', updateAdministratorPassword);
router.delete('/administrators/:id', deleteAdministrator);

// Sidebar stats (lightweight)
router.get('/sidebar-stats', getSidebarStats);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Experts
router.get('/experts', getExperts);
router.get('/experts/:id', getExpertById);
router.patch('/experts/:id/approve', approveExpert);
router.patch('/experts/:id/reject', rejectExpert);
router.patch('/experts/:id/bank/approve', approveExpertBankDetails);
router.patch('/experts/:id/bank/reject', rejectExpertBankDetails);
router.patch('/experts/:id/status', updateExpertStatus);
router.delete('/experts/:id', deleteExpert);

// Expert Document Verification
router.get('/experts/:expertId/documents', getExpertDocumentsForAdmin);
router.patch('/experts/:expertId/documents/:documentId/verify', verifyExpertDocument);
router.patch('/experts/:expertId/documents/:documentId/reject', rejectExpertDocument);
router.patch('/experts/:expertId/documents/:documentId/request-reupload', requestDocumentReupload);
router.patch('/experts/:expertId/documents/:documentId/notes', updateDocumentAdminNotes);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Document Requirements (Admin Category Management)
router.get('/document-requirements', getAdminDocumentRequirements);
router.post('/document-requirements', createDocumentRequirement);
router.patch('/document-requirements/:id', updateDocumentRequirement);
router.delete('/document-requirements/:id', deleteDocumentRequirement);

// SubCategories
router.get('/sub-categories', getSubCategories);
router.post('/sub-categories', createSubCategory);
router.patch('/sub-categories/:id', updateSubCategory);

// Consultations
router.get('/consultations', getAllConsultations);
router.get('/consultations/stats', getConsultationStats);
router.get('/consultations/:id', getConsultationById);
router.patch('/consultations/:id/status', updateConsultationStatus);

// Payments
router.get('/payments', getAllPayments);

// Transactions & Revenue
router.get('/transactions', getAllTransactions);
router.get('/revenue', getRevenue);

// Coupons & Recharge Vouchers
const {
  getAllCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin
} = require('../controllers/couponController');

router.get('/coupons', getAllCouponsAdmin);
router.post('/coupons', createCouponAdmin);
router.patch('/coupons/:id', updateCouponAdmin);
router.delete('/coupons/:id', deleteCouponAdmin);

// Review Moderation
const {
  getAllReviewsAdmin,
  updateReviewStatusAdmin,
  deleteReviewAdmin
} = require('../controllers/reviewController');

router.get('/reviews', getAllReviewsAdmin);
router.patch('/reviews/:id/status', updateReviewStatusAdmin);
router.delete('/reviews/:id', deleteReviewAdmin);

// Broadcast Announcements to Users & Experts
router.post('/broadcast', sendBroadcastNotification);
router.get('/broadcasts', getBroadcastHistory);

// Contact Inquiries
const {
  getInquiries,
  updateInquiryStatus,
  replyToInquiry,
  deleteInquiry
} = require('../controllers/contactController');

router.get('/contact-inquiries', getInquiries);
router.put('/contact-inquiries/:id/status', updateInquiryStatus);
router.post('/contact-inquiries/:id/reply', replyToInquiry);
router.delete('/contact-inquiries/:id', deleteInquiry);

module.exports = router;
