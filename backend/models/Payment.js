const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  // Multi-Razorpay Account tracking
  razorpayAccountId: { type: String }, // Razorpay Merchant ID / public key
  accountCode: { type: String, enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3', 'UNKNOWN'], default: 'RAZORPAY_1', index: true },
  transactionType: { type: String, default: 'PAYMENT', index: true },
  internalTransactionId: { type: String, index: true },
  providerOrderId: { type: String, index: true },
  providerPaymentId: { type: String, index: true },
  providerPayoutId: { type: String },
  mode: { type: String, enum: ['test', 'live', 'unknown'], default: 'test' },
  refundId: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundedAt: { type: Date },
  amount: { type: Number, required: true }, // in lowest denomination (paise)
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
  paymentMethod: { type: String },
  walletUsed: { type: Number, default: 0 },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
