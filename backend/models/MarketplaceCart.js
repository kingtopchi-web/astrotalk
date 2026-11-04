const mongoose = require('mongoose');

const marketplaceCartSchema = new mongoose.Schema({
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
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceProduct',
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

marketplaceCartSchema.index({ userId: 1, userModel: 1 }, { unique: true });

module.exports = mongoose.model('MarketplaceCart', marketplaceCartSchema);

