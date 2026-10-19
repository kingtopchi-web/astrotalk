const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification
} = require('../controllers/notificationController');

router.use(protect);

router.route('/')
  .get(getNotifications)
  .post(createNotification);

router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;
