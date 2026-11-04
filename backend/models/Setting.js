const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // Global single document key to ensure only one document is used for global settings
  singletonKey: {
    type: String,
    default: 'GLOBAL_SETTINGS',
    unique: true
  },
  
  // General
  platformName: { type: String, default: 'Stitch Consultation Marketplace' },
  supportEmail: { type: String, default: 'support@stitchplatform.com' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata (IST)' },
  address: { type: String, default: 'Plot 42, Tech Park, Bengaluru, Karnataka, India' },
  
  // Consultation & Commission
  platformCommissionRate: { type: Number, default: 20 }, // stored as percentage (20 for 20%)
  minimumConsultationDuration: { type: Number, default: 15 },
  cancellationWindowHours: { type: Number, default: 2 },
  autoApproveExperts: { type: Boolean, default: false },
  enableInstantBooking: { type: Boolean, default: true },
  
  // Digital Products Marketplace Settings
  marketplaceCommissionRate: { type: Number, default: 10 }, // percentage (e.g. 10%)
  marketplaceAllowedExtensions: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4']
  },
  marketplaceMaxFileSizeMb: { type: Number, default: 50 },
  marketplaceAutoApprove: { type: Boolean, default: false },
  
  // Free Chat Settings (Dynamic Admin Control)
  enableFreeChat: { type: Boolean, default: true },
  freeChatDurationMinutes: { type: Number, default: 5 }, // Admin sets dynamic duration in minutes
  
  // Geolocation & Proximity Settings (Dynamic Admin Control)
  minimumExpertDistanceKm: { type: Number, default: 0 }, // Admin sets minimum required distance between user & expert in KM (0 = disabled)
  
  // Security
  sessionTimeoutMinutes: { type: Number, default: 60 },
  requireEmailVerification: { type: Boolean, default: true },
  twoFactorAdmin: { type: Boolean, default: false },
  maxLoginAttempts: { type: Number, default: 5 },
  
  // Notifications
  emailNewBookings: { type: Boolean, default: true },
  emailExpertApplications: { type: Boolean, default: true },
  smsSessionReminders: { type: Boolean, default: true },
  adminAlertWeeklyDigest: { type: Boolean, default: true },
  
  // Payments & Multi-Razorpay Account Management
  paymentGateway: { type: String, default: 'Razorpay' },
  gatewayMode: { type: String, default: 'test' },
  payoutCycle: { type: String, default: 'weekly' },
  minPayoutAmount: { type: Number, default: 1000 },
  defaultPaymentAccount: {
    type: String,
    enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'],
    default: 'RAZORPAY_1'
  },
  defaultPayoutAccount: {
    type: String,
    enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'],
    default: 'RAZORPAY_1'
  },
  enablePaymentFallback: {
    type: Boolean,
    default: false
  },
  razorpayAccounts: [
    {
      accountCode: {
        type: String,
        enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'],
        required: true
      },
      displayName: { type: String, default: '' },
      isEnabled: { type: Boolean, default: true },
      payoutEnabled: { type: Boolean, default: false },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  razorpayAuditLogs: [
    {
      action: { type: String },
      changedBy: { type: String },
      details: { type: mongoose.Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
