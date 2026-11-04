const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'buyerModel'
  },
  buyerModel: {
    type: String,
    required: true,
    enum: ['User', 'Expert']
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceProduct',
      required: true
    },
    productTitle: { type: String, required: true },
    productSlug: { type: String, required: true },
    coverImage: { type: String },
    price: { type: Number, required: true },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'items.sellerModel'
    },
    sellerModel: {
      type: String,
      required: true,
      enum: ['User', 'Expert']
    },
    sellerName: { type: String, required: true },
    platformCommissionRate: { type: Number, default: 10 }, // percentage
    platformCommissionAmount: { type: Number, default: 0 },
    sellerEarnings: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
    downloadAccessRevoked: { type: Boolean, default: false }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'WALLET'],
    default: 'RAZORPAY'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED'],
    default: 'PENDING'
  },
  orderStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  accountCode: {
    type: String,
    default: 'RAZORPAY_1'
  },
  refundDetails: {
    refundedAt: { type: Date },
    refundId: { type: String },
    amount: { type: Number },
    reason: { type: String }
  }
}, {
  timestamps: true
});

marketplaceOrderSchema.index({ buyerId: 1, buyerModel: 1, paymentStatus: 1 });
marketplaceOrderSchema.index({ razorpayOrderId: 1 });
marketplaceOrderSchema.index({ 'items.sellerId': 1 });

module.exports = mongoose.model('MarketplaceOrder', marketplaceOrderSchema);

