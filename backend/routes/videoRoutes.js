const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const videoController = require('../controllers/videoController');

// All routes require authentication
router.use(protect);

// User endpoints
router.post('/sessions/:consultationId/join', authorizeRoles('USER'), videoController.userJoinSession);
router.post('/sessions/:consultationId/leave', authorizeRoles('USER'), videoController.userLeaveSession);

// Expert endpoints
router.get('/expert/waiting', authorizeRoles('EXPERT'), videoController.getWaitingUsers);
router.post('/expert/sessions/:consultationId/join', authorizeRoles('EXPERT'), videoController.expertJoinSession);
router.post('/expert/sessions/:consultationId/start', authorizeRoles('EXPERT'), videoController.startSession);
router.post('/expert/sessions/:consultationId/end', authorizeRoles('EXPERT'), videoController.endSession);

// Common endpoints
router.get('/sessions/:consultationId/status', videoController.getSessionStatus);
router.post('/sessions/:consultationId/heartbeat', videoController.sessionHeartbeat);

module.exports = router;
