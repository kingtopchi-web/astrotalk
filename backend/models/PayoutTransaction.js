const mongoose = require('mongoose');

const payoutTransactionSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  accountCode: {
    type: String,
    enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'],
    required: true,
    index: true,
  },
  razorpayAccountId: {
    type: String,
  },
  mode: {
    type: String,
    enum: ['NEFT', 'RTGS', 'IMPS', 'UPI', 'test'],
    default: 'NEFT',
  },
  status: {
    type: String,
    enum: ['PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVERSED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  internalTransactionId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  idempotencyKey: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  providerPayoutId: {
    type: String,
    index: true,
  },
  providerFundAccountId: {
    type: String,
  },
  providerContactId: {
    type: String,
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String,
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
  },
  failureReason: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
  reversedAt: {
    type: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model('PayoutTransaction', payoutTransactionSchema);

