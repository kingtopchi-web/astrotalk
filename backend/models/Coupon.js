const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['RECHARGE_BONUS', 'VOUCHER'],
    default: 'RECHARGE_BONUS',
    index: true
  },
  discountType: {
    type: String,
    enum: ['FLAT', 'PERCENTAGE'],
    default: 'FLAT'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minRechargeAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    default: 'OFFER'
  },
  validTill: {
    type: Date,
    default: null
  },
  usageLimit: {
    type: Number,
    default: 0 // 0 = unlimited total usages
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  usedBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      usedAt: {
        type: Date,
        default: Date.now
      },
      bonusAmount: {
        type: Number,
        default: 0
      },
      rechargeAmount: {
        type: Number,
        default: 0
      }
    }
  ],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);

