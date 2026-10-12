const Notification = require('../models/Notification');

/**
 * Creates a notification in DB and emits real-time socket event if io is available.
 * @param {Object} options
 * @param {string|ObjectId} options.recipient
 * @param {string} options.recipientRole - 'USER' | 'EXPERT' | 'ADMIN'
 * @param {string} options.recipientModel - 'User' | 'Expert' | 'Admin'
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} options.type
 * @param {string} options.link
 * @param {string} options.actionText
 * @param {string} options.badge
 * @param {Object} [io] - Socket.io instance
 */
const sendNotification = async ({
  recipient,
  recipientRole = 'USER',
  recipientModel = 'User',
  title,
  message,
  type = 'general',
  link = '',
  actionText = '',
  badge = '',
  data = null
}, io = null) => {
  try {
    const notification = await Notification.create({
      recipient,
      recipientRole,
      recipientModel,
      title,
      message,
      type,
      link,
      actionText,
      badge,
      isRead: false
    });

    // Real-time Socket.io push if available
    if (io) {
      if (recipient) {
        io.to(`user_${recipient}`).emit('new_notification', notification);
      }
      if (recipientRole === 'ADMIN') {
        io.to('role_ADMIN').emit('new_notification', notification);
      }
      if (recipientRole === 'EXPERT') {
        io.to('role_EXPERT').emit('new_notification', notification);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating dynamic notification:', err);
    return null;
  }
};

module.exports = {
  sendNotification
};
