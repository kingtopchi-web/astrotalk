const mongoose = require('mongoose');

const marketplaceDownloadLogSchema = new mongoose.Schema({
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
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  buyerModel: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

marketplaceDownloadLogSchema.index({ order: 1, product: 1, buyerId: 1 });

module.exports = mongoose.model('MarketplaceDownloadLog', marketplaceDownloadLogSchema);

