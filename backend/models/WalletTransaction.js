const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT', 'REFUND'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
  },
  currency: {
    type: String,
    default: 'INR',
  },
  // Multi-Razorpay Account tracking
  razorpayAccountId: {
    type: String,
  },
  accountCode: {
    type: String,
    enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3', 'UNKNOWN'],
    default: 'RAZORPAY_1',
    index: true,
  },
  transactionType: {
    type: String,
    default: 'TOPUP',
    index: true,
  },
  internalTransactionId: {
    type: String,
    index: true,
  },
  providerOrderId: {
    type: String,
    index: true,
  },
  providerPaymentId: {
    type: String,
    index: true,
  },
  providerPayoutId: {
    type: String,
    index: true,
  },
  mode: {
    type: String,
    enum: ['test', 'live', 'unknown'],
    default: 'test',
  },
  completedAt: {
    type: Date,
  },
  couponCode: {
    type: String,
    trim: true,
  },
  bonusAmount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
