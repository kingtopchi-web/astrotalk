const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    required: false
  },
  recipientModel: {
    type: String,
    enum: ['User', 'Expert', 'Admin'],
    default: 'User'
  },
  recipientRole: {
    type: String,
    enum: ['USER', 'EXPERT', 'ADMIN'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'booking_confirmed',
      'expert_ready',
      'chat_message',
      'wallet_update',
      'rate_consultation',
      'consultation_request',
      'incoming_call',
      'earnings_update',
      'upcoming_session',
      'expert_registration',
      'payment_alert',
      'complaint_report',
      'system_alert',
      'general'
    ],
    default: 'general'
  },
  actionText: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, recipientRole: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
