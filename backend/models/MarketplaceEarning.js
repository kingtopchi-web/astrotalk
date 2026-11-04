const mongoose = require('mongoose');

const marketplaceEarningSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sellerModel'
  },
  sellerModel: {
    type: String,
    required: true,
    enum: ['User', 'Expert']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceOrder',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceProduct',
    required: true
  },
  grossAmount: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true // e.g. 10 for 10%
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  netEarnings: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'AVAILABLE', 'WITHDRAWN', 'REFUNDED'],
    default: 'AVAILABLE'
  },
  withdrawalTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayoutTransaction'
  }
}, {
  timestamps: true
});

marketplaceEarningSchema.index({ sellerId: 1, sellerModel: 1, status: 1 });
marketplaceEarningSchema.index({ order: 1 });

module.exports = mongoose.model('MarketplaceEarning', marketplaceEarningSchema);

