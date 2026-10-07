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
  languages: { type: [String], default: ['English'] },

  documents: { type: [String] }, // Array of document URLs

  rates: {
    chat: { type: Number, default: 0 },
    audio: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
  },
  
  pricePerMinute: { type: Number, default: 0 }, // Legacy for compatibility

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
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' }
  }
}, { timestamps: true });

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
