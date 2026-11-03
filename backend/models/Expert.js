const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'EXPERT' },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },

  specialty: { type: String, required: true },
  qualification: { type: String },
  specialization: { type: String },
  experience: { type: String },
  bio: { type: String },
  languages: { type: [String], default: ['English', 'Hindi'] },
  country: { type: String, default: 'India' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  distanceKm: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },

  documents: { type: [String] }, // Array of document URLs

  rates: {
    chat: { type: Number, default: 5, min: [5, 'Chat rate must be at least ₹5 per minute'] },
    audio: { type: Number, default: 10, min: [10, 'Audio call rate must be at least ₹10 per minute'] },
    video: { type: Number, default: 20, min: [20, 'Video call rate must be at least ₹20 per minute'] },
  },
  
  pricePerMinute: { type: Number, default: 5, min: [5, 'Price per minute must be at least ₹5'] }, // Legacy for compatibility

  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  profileImage: { type: String, default: '' },

  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  rejectionReason: { type: String },
  rejectedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'],
    default: 'ACTIVE',
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'busy'],
    default: 'offline',
  },
  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    isAvailable: { type: Boolean, default: false }
  }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  walletBalance: { type: Number, default: 0 },
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    passbookImage: { type: String, default: '' }, // URL or Base64 image of bank passbook / cancelled cheque
    verificationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_SUBMITTED'
    },
    rejectionReason: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Ensure legacy rates are at least platform minimums before validation
expertSchema.pre('validate', function () {
  if (!this.rates) this.rates = { chat: 5, audio: 10, video: 20 };
  if (this.rates.chat === undefined || this.rates.chat === null || this.rates.chat < 5) this.rates.chat = 5;
  if (this.rates.audio === undefined || this.rates.audio === null || this.rates.audio < 10) this.rates.audio = 10;
  if (this.rates.video === undefined || this.rates.video === null || this.rates.video < 20) this.rates.video = 20;
  if (this.pricePerMinute === undefined || this.pricePerMinute === null || this.pricePerMinute < 5) this.pricePerMinute = 5;
});

// Hash password before saving
expertSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match expert entered password to hashed password in database
expertSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Expert', expertSchema);
