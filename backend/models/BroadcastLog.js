const mongoose = require('mongoose');

const broadcastLogSchema = new mongoose.Schema({
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
  targetAudience: {
    type: String,
    enum: ['ALL', 'USERS', 'EXPERTS'],
    default: 'ALL'
  },
  badge: {
    type: String,
    default: 'Important'
  },
  link: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  recipientsCount: {
    users: { type: Number, default: 0 },
    experts: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  sentBy: {
    type: String,
    default: 'Administrator'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BroadcastLog', broadcastLogSchema);

