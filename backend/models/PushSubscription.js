const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userModel',
      index: true
    },
    userRole: {
      type: String,
      enum: ['EXPERT', 'USER'],
      default: 'EXPERT',
      index: true
    },
    userModel: {
      type: String,
      enum: ['Expert', 'User'],
      default: 'Expert'
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    expirationTime: {
      type: Number,
      default: null
    },
    userAgent: {
      type: String,
      default: ''
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index to quickly find devices of an expert
pushSubscriptionSchema.index({ userId: 1, userRole: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
