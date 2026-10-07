const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const supportController = require('../controllers/supportController');

// Public or User routes for Help Articles
router.get('/articles', supportController.getHelpArticles);

// Ticket routes (Protected)
router.post('/tickets', auth, supportController.createTicket);
router.get('/tickets', auth, supportController.getUserTickets);
router.get('/tickets/:id', auth, supportController.getTicketDetails);
router.post('/tickets/:id/reply', auth, supportController.addReply);

// Admin Ticket Routes
const { authorizeRoles } = require('../middleware/authMiddleware');
router.get('/admin/tickets', auth, authorizeRoles('ADMIN'), supportController.getAllTickets);
router.put('/admin/tickets/:id/status', auth, authorizeRoles('ADMIN'), supportController.updateTicketStatus);

module.exports = router;
