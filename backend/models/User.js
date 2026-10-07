const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  role: {
    type: String,
    enum: ['USER', 'EXPERT', 'ADMIN'],
    default: 'USER',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'],
    default: 'ACTIVE',
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  profileImage: {
    type: String,
    default: '',
  },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  dateOfBirth: { type: Date },
  savedExperts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Settings
  notificationPreferences: {
    email: {
      consultation: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      wallet: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      support: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      consultation: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      wallet: { type: Boolean, default: false },
      support: { type: Boolean, default: true }
    }
  },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private', 'experts_only'], default: 'public' },
    onlineStatus: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true }
  },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  language: { type: String, default: 'en' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
