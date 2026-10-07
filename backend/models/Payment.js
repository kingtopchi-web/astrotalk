const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true }, // in lowest denomination (paise)
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
  paymentMethod: { type: String },
  walletUsed: { type: Number, default: 0 },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
