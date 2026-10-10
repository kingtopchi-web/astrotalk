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
  updateExpertStatus,
  deleteExpert,
  getCategories,
  createCategory,
  updateCategory,
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
  updateSettings
} = require('../controllers/adminController');

// All routes require authentication and ADMIN role
router.use(protect);
router.use(authorizeRoles('ADMIN'));

// Profile
router.get('/profile', getAdminProfile);
router.patch('/profile', updateAdminProfile);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

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
router.patch('/experts/:id/status', updateExpertStatus);
router.delete('/experts/:id', deleteExpert);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);

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

module.exports = router;
