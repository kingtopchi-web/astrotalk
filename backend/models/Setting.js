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
  
  // Payments
  paymentGateway: { type: String, default: 'Razorpay' },
  gatewayMode: { type: String, default: 'test' },
  payoutCycle: { type: String, default: 'weekly' },
  minPayoutAmount: { type: Number, default: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
