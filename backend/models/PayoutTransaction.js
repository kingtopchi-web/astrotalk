const mongoose = require('mongoose');

const payoutTransactionSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    index: true,
    required: false
  },
  // Polymorphic recipient: supports both Expert and User (marketplace sellers)
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    index: true
  },
  recipientModel: {
    type: String,
    enum: ['Expert', 'User'],
    default: 'Expert',
    index: true
  },
  payoutType: {
    type: String,
    enum: ['CONSULTATION', 'MARKETPLACE_SELLER'],
    default: 'CONSULTATION'
  },
  amount: {
    type: Number,
    required: true,
  },
  // Penny-Drop ₹1 Verification support
  pennyDropAmount: {
    type: Number,
    default: 1
  },
  remainingAmount: {
    type: Number
  },
  pennyDropConfirmed: {
    type: Boolean,
    default: false
  },
  pennyDropConfirmedAt: {
    type: Date
  },
  pennyDropTransactionRef: {
    type: String
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
    enum: [
      'VERIFICATION_PENDING', // ₹1 Penny-drop sent, waiting for user/expert to confirm receipt
      'PENDING',              // Confirmed / ready for remaining balance payout processing
      'QUEUED',
      'PROCESSING',
      'PROCESSED',
      'FAILED',
      'REVERSED',
      'CANCELLED'
    ],
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
    passbookImage: String,
    bankVerificationStatus: String,
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
