const Notification = require('../models/Notification');

// Default sample notifications matching the user's exact specification
const getDefaultNotifications = (role, userId) => {
  const recipientModel = role === 'EXPERT' ? 'Expert' : (role === 'ADMIN' ? 'Admin' : 'User');

  if (role === 'USER') {
    return [
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'USER',
        title: 'Booking Confirmed',
        message: 'Your consultation with Dr. Rahul has been confirmed.',
        actionText: 'Open booking details',
        badge: 'New',
        link: '/bookings',
        type: 'booking_confirmed',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 min ago
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'USER',
        title: 'Expert Ready to Connect',
        message: 'Your video consultation is ready to start.',
        actionText: 'Join consultation',
        badge: '',
        link: '/bookings',
        type: 'expert_ready',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'USER',
        title: 'New Chat Message',
        message: 'Your expert has sent you a message.',
        actionText: 'Open chat',
        badge: '',
        link: '/messages',
        type: 'chat_message',
        isRead: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'USER',
        title: 'Wallet Update',
        message: 'Your recharge or consultation payment status has changed.',
        actionText: 'View transactions',
        badge: '',
        link: '/wallet',
        type: 'wallet_update',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 3 * 3600 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'USER',
        title: 'Rate Your Consultation',
        message: 'Share your feedback about your completed session.',
        actionText: 'Write a review',
        badge: '',
        link: '/bookings',
        type: 'rate_consultation',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 24 * 3600 * 1000)
      }
    ];
  }

  if (role === 'EXPERT') {
    return [
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'EXPERT',
        title: 'New Consultation Request',
        message: 'Priya Sharma requested a 30-minute video consultation.',
        actionText: 'View request · Accept or reject',
        badge: 'New',
        link: '/expert/consultations',
        type: 'consultation_request',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'EXPERT',
        title: 'Incoming Call',
        message: 'A user is requesting an audio/video session.',
        actionText: 'Open incoming call screen',
        badge: '',
        link: '/expert/consultations',
        type: 'incoming_call',
        isRead: false,
        createdAt: new Date(Date.now() - 25 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'EXPERT',
        title: 'Earnings Update',
        message: 'Your consultation earnings or payout status has been updated.',
        actionText: 'View earnings',
        badge: '',
        link: '/expert/earnings',
        type: 'earnings_update',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'EXPERT',
        title: 'Upcoming Session',
        message: 'You have a consultation scheduled in 15 minutes.',
        actionText: 'View schedule',
        badge: '',
        link: '/expert/schedule',
        type: 'upcoming_session',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 5 * 3600 * 1000)
      }
    ];
  }

  if (role === 'ADMIN') {
    return [
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'ADMIN',
        title: 'New Expert Registration',
        message: 'A new expert has submitted an application for approval.',
        actionText: 'Review application',
        badge: 'New',
        link: '/admin/experts',
        type: 'expert_registration',
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'ADMIN',
        title: 'Payment / Refund Alert',
        message: 'A payment, refund or payout requires attention.',
        actionText: 'Open transaction details',
        badge: '',
        link: '/admin/payments',
        type: 'payment_alert',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'ADMIN',
        title: 'New Complaint or Report',
        message: 'A user has reported an issue with a consultation.',
        actionText: 'Review support case',
        badge: '',
        link: '/admin/consultations',
        type: 'complaint_report',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        recipient: userId,
        recipientModel,
        recipientRole: 'ADMIN',
        title: 'System Alert',
        message: 'Important failures or unusual activity requiring admin attention.',
        actionText: 'Open system monitoring',
        badge: '',
        link: '/admin/dashboard',
        type: 'system_alert',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 6 * 3600 * 1000)
      }
    ];
  }

  return [];
};

// @desc    Get all notifications for logged in user/expert/admin
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const role = req.user.role || 'USER';
    const userId = req.user._id;

    // Check if user has any notification records (including deleted ones)
    const totalExisting = await Notification.countDocuments({
      $or: [
        { recipient: userId },
        { recipientRole: role, recipient: null }
      ]
    });

    // Only seed once if this user has never had any notification records created
    if (totalExisting === 0) {
      const defaults = getDefaultNotifications(role, userId);
      if (defaults.length > 0) {
        await Notification.insertMany(defaults);
      }
    }

    // Return active notifications that are not marked as deleted
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipientRole: role, recipient: null }
      ],
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [
        { recipient: req.user._id },
        { recipientRole: req.user.role, recipient: null }
      ],
      isRead: false
    });

    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const role = req.user.role || 'USER';
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipientRole: role, recipient: null }
        ],
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete single notification (soft delete so re-seeding is not triggered)
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isDeleted: true });

    const unreadCount = await Notification.countDocuments({
      $or: [
        { recipient: req.user._id },
        { recipientRole: req.user.role, recipient: null }
      ],
      isRead: false,
      isDeleted: { $ne: true }
    });

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear all notifications for logged in user (soft delete)
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const role = req.user.role || 'USER';
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipientRole: role, recipient: null }
        ],
        isDeleted: { $ne: true }
      },
      {
        $set: { isDeleted: true, isRead: true }
      }
    );

    res.json({
      success: true,
      message: 'All notifications cleared successfully',
      unreadCount: 0,
      notifications: []
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new notification (system/admin or internal hook)
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
  try {
    const { recipient, recipientRole, title, message, type, link, actionText, badge } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      recipient: recipient || req.user._id,
      recipientRole: recipientRole || req.user.role,
      recipientModel: (recipientRole || req.user.role) === 'EXPERT' ? 'Expert' : ((recipientRole || req.user.role) === 'ADMIN' ? 'Admin' : 'User'),
      title,
      message,
      type: type || 'general',
      link: link || '',
      actionText: actionText || '',
      badge: badge || '',
      isRead: false
    });

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
