const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // Global single document key to ensure only one document is used for global settings
  singletonKey: {
    type: String,
    default: 'GLOBAL_SETTINGS',
    unique: true
  },
  
  // General & Branding
  platformName: { type: String, default: 'Stitch Consultation Marketplace' },
  platformLogo: { type: String, default: '' },
  supportEmail: { type: String, default: 'support@stitchplatform.com' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata (IST)' },
  address: { type: String, default: 'Plot 42, Tech Park, Bengaluru, Karnataka, India' },

  // Dynamic Home Hero Slider (Admin Managed)
  heroSlides: [
    {
      image: { type: String, required: true },
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      link: { type: String, default: '' },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }
  ],

  // Dynamic Homepage 3-Column Stats Card
  homeStats: {
    stat1Value: { type: String, default: '100k+' },
    stat1Label: { type: String, default: 'Consultations' },
    stat2Value: { type: String, default: '4.9' },
    stat2Label: { type: String, default: 'Avg. Rating' },
    stat3Value: { type: String, default: 'Top 1%' },
    stat3Label: { type: String, default: 'Vetted Minds' },
  },

  // Dynamic Footer Social Media Links
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  
  // Consultation & Commission
  platformCommissionRate: { type: Number, default: 20 }, // stored as percentage (20 for 20%)
  minimumConsultationDuration: { type: Number, default: 15 },
  cancellationWindowHours: { type: Number, default: 2 },
  autoApproveExperts: { type: Boolean, default: false },
  enableInstantBooking: { type: Boolean, default: true },
  
  // Digital Products Marketplace Settings
  enableMarketplace: { type: Boolean, default: true },
  marketplaceCommissionRate: { type: Number, default: 10 }, // percentage (e.g. 10%)
  marketplaceAllowedExtensions: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4']
  },
  marketplaceMaxFileSizeMb: { type: Number, default: 50 },
  marketplaceAutoApprove: { type: Boolean, default: false },
  marketplacePayoutHoldDays: { type: Number, default: 7 }, // Admin sets holding period in days before seller gets payout
  marketplaceDownloadLimit: { type: Number, default: 5 }, // Max downloads per purchase (0 for unlimited)
  marketplaceDownloadExpiryDays: { type: Number, default: 30 }, // Days download link is valid (0 for lifetime)
  platformTaxRate: { type: Number, default: 18 }, // Tax / GST rate percentage (e.g. 18%)
  
  // Free Chat Settings (Dynamic Admin Control)
  enableFreeChat: { type: Boolean, default: true },
  freeChatDurationMinutes: { type: Number, default: 5 }, // Admin sets dynamic duration in minutes

  // Chat History Retention & Deletion Policy (Dynamic Admin Control)
  enableAutoDeleteOldChats: { type: Boolean, default: false },
  chatRetentionDays: { type: Number, default: 30 }, // Delete messages older than X days (e.g. 7, 15, 30, 60, 90, 180)
  lastChatCleanupAt: { type: Date, default: null },
  lastCleanedMessagesCount: { type: Number, default: 0 },
  
  // Call Safety Guidelines & Privacy Tips (Dynamic Admin Control)
  callSafetyTips: {
    type: String,
    default: '• अपनी प्राइवेसी बनाए रखने के लिए अपना मोबाइल नंबर, नाम, पता, बैंक A/C नंबर या OTP किसी से शेयर न करें।\n• प्लेटफॉर्म के बाहर किसी से भी पैसे का लेन-देन न करें।\n• किसी भी असुरक्षित स्थान पर किसी से व्यक्तिगत रूप से न मिलें।\n• किसी के बहकावे अथवा लालच के शिकार न हों।'
  },
  
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
  payoutDaysInterval: { type: Number, default: 7 }, // Minimum interval (in days) between expert payout requests
  payoutEstimatedDays: { type: Number, default: 3 }, // Estimated days to process payout
  minPayoutAmount: { type: Number, default: 100 },
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
