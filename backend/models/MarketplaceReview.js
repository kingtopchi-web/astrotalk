const mongoose = require('mongoose');

const marketplaceReviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceProduct',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceOrder',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Expert']
  },
  userName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['PUBLISHED', 'HIDDEN'],
    default: 'PUBLISHED'
  }
}, {
  timestamps: true
});

marketplaceReviewSchema.index({ product: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('MarketplaceReview', marketplaceReviewSchema);

