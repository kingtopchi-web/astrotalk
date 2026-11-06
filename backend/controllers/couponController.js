const Coupon = require('../models/Coupon');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const crypto = require('crypto');
const { sendNotification } = require('../utils/notificationDispatcher');

/**
 * Seed default dynamic recharge coupons and vouchers if database collection is empty
 */
async function seedDefaultCoupons() {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          code: 'WELCOME50',
          title: 'Flat ₹50 Extra Bonus',
          description: 'Get ₹50 extra bonus balance on your first recharge of ₹200 or more.',
          type: 'RECHARGE_BONUS',
          discountType: 'FLAT',
          discountValue: 50,
          minRechargeAmount: 200,
          badge: 'POPULAR',
          perUserLimit: 1,
          isActive: true
        },
        {
          code: 'EXTRA100',
          title: 'Flat ₹100 Recharge Bonus',
          description: 'Get flat ₹100 extra wallet credits on any recharge of ₹500 or more.',
          type: 'RECHARGE_BONUS',
          discountType: 'FLAT',
          discountValue: 100,
          minRechargeAmount: 500,
          badge: 'BEST VALUE',
          perUserLimit: 3,
          isActive: true
        },
        {
          code: 'CASHBACK20',
          title: '20% Extra Bonus Credits',
          description: 'Enjoy 20% bonus recharge credits up to ₹300 on recharge of ₹300 or more.',
          type: 'RECHARGE_BONUS',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minRechargeAmount: 300,
          maxDiscountAmount: 300,
          badge: 'HOT OFFER',
          perUserLimit: 2,
          isActive: true
        },
        {
          code: 'MEGA500',
          title: 'Mega Saver ₹500 Bonus',
          description: 'Flat ₹500 instant bonus added to your wallet on recharge of ₹2000 or more.',
          type: 'RECHARGE_BONUS',
          discountType: 'FLAT',
          discountValue: 500,
          minRechargeAmount: 2000,
          badge: 'MEGA SAVER',
          perUserLimit: 5,
          isActive: true
        },
        {
          code: 'GIFT100',
          title: 'Special ₹100 Free Gift Voucher',
          description: 'Redeem directly to get ₹100 free consultation balance instantly credited to your wallet.',
          type: 'VOUCHER',
          discountType: 'FLAT',
          discountValue: 100,
          minRechargeAmount: 0,
          badge: 'FREE GIFT',
          perUserLimit: 1,
          isActive: true
        }
      ];
      await Coupon.insertMany(defaults);
      console.log('Seeded initial default recharge coupons and vouchers successfully.');
    }
  } catch (err) {
    console.error('Error seeding default coupons:', err.message);
  }
}

// Auto-seed on startup
seedDefaultCoupons();

// @route   GET /api/wallet/coupons
// @desc    Get active coupons and vouchers available for user
// @access  Public / Private
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [{ validTill: null }, { validTill: { $gt: now } }]
    };

    const coupons = await Coupon.find(query).sort({ minRechargeAmount: 1, createdAt: -1 });

    const userId = req.user?._id;
    const formatted = coupons.map((c) => {
      let isUsedByUser = false;
      let userUsesCount = 0;
      if (userId && c.usedBy && c.usedBy.length > 0) {
        userUsesCount = c.usedBy.filter((u) => u.user && u.user.toString() === userId.toString()).length;
        if (c.perUserLimit > 0 && userUsesCount >= c.perUserLimit) {
          isUsedByUser = true;
        }
      }

      return {
        _id: c._id,
        code: c.code,
        title: c.title,
        description: c.description,
        type: c.type,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minRechargeAmount: c.minRechargeAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        badge: c.badge,
        validTill: c.validTill,
        isUsedByUser,
        userUsesCount,
        perUserLimit: c.perUserLimit
      };
    });

    return res.json({
      success: true,
      coupons: formatted
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
};

// @route   POST /api/wallet/apply-coupon
// @desc    Validate and calculate bonus for recharge amount
// @access  Private
exports.applyCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const rechargeAmount = parseFloat(amount);

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    if (!rechargeAmount || rechargeAmount <= 0 || isNaN(rechargeAmount)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid recharge amount first' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    // Check expiry
    if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired' });
    }

    // Check minimum recharge requirement
    if (coupon.minRechargeAmount > 0 && rechargeAmount < coupon.minRechargeAmount) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum recharge of ₹${coupon.minRechargeAmount}. Please increase amount to apply.`
      });
    }

    // Check total usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This offer usage limit has been reached' });
    }

    // Check per-user limit
    const userId = req.user._id;
    if (coupon.perUserLimit > 0 && coupon.usedBy && coupon.usedBy.length > 0) {
      const userCount = coupon.usedBy.filter((u) => u.user && u.user.toString() === userId.toString()).length;
      if (userCount >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already redeemed this coupon the maximum allowed times (${coupon.perUserLimit}x)`
        });
      }
    }

    // Calculate bonus amount
    let bonusAmount = 0;
    if (coupon.discountType === 'FLAT') {
      bonusAmount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE') {
      bonusAmount = (rechargeAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && bonusAmount > coupon.maxDiscountAmount) {
        bonusAmount = coupon.maxDiscountAmount;
      }
    }
    bonusAmount = Math.round(bonusAmount * 100) / 100;

    const totalCredit = rechargeAmount + bonusAmount;

    return res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied! You will receive ₹${bonusAmount} EXTRA wallet credits.`,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        bonusAmount,
        rechargeAmount,
        totalCredit
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    return res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
};

// @route   POST /api/wallet/redeem-voucher
// @desc    Direct instant redemption of a Gift/Recharge Voucher without Razorpay payment
// @access  Private
exports.redeemVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Voucher code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive voucher code' });
    }

    if (coupon.type !== 'VOUCHER') {
      return res.status(400).json({
        success: false,
        message: `'${coupon.code}' is a recharge bonus coupon. Please apply it during wallet recharge above.`
      });
    }

    // Check expiry
    if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
      return res.status(400).json({ success: false, message: 'This voucher code has expired' });
    }

    // Check total usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This voucher has reached its maximum redemptions' });
    }

    // Check per-user limit
    const userId = req.user._id;
    if (coupon.perUserLimit > 0 && coupon.usedBy && coupon.usedBy.length > 0) {
      const userCount = coupon.usedBy.filter((u) => u.user && u.user.toString() === userId.toString()).length;
      if (userCount >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already redeemed voucher '${coupon.code}'`
        });
      }
    }

    const voucherValue = coupon.discountValue;
    if (!voucherValue || voucherValue <= 0) {
      return res.status(400).json({ success: false, message: 'Voucher value is invalid' });
    }

    // Atomically credit user's wallet
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + voucherValue;

    user.walletBalance = balanceAfter;
    await user.save();

    // Create a transaction record
    const internalTransactionId = `VOUCHER_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const transaction = new WalletTransaction({
      user: userId,
      type: 'CREDIT',
      amount: voucherValue,
      status: 'SUCCESS',
      balanceBefore,
      balanceAfter,
      description: `Gift Voucher Redeemed: ${coupon.code} (+₹${voucherValue})`,
      transactionType: 'VOUCHER',
      internalTransactionId,
      couponCode: coupon.code,
      bonusAmount: voucherValue,
      completedAt: new Date()
    });
    await transaction.save();

    // Record usage in coupon
    coupon.usedCount += 1;
    coupon.usedBy.push({
      user: userId,
      usedAt: new Date(),
      bonusAmount: voucherValue,
      rechargeAmount: 0
    });
    await coupon.save();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      sendNotification(
        {
          recipient: userId,
          recipientRole: 'USER',
          recipientModel: 'User',
          title: 'Voucher Redeemed!',
          message: `Congratulations! ₹${voucherValue} voucher (${coupon.code}) credited to your wallet. New balance: ₹${balanceAfter}.`,
          actionText: 'View wallet',
          link: '/wallet',
          type: 'wallet_update',
          badge: 'Success'
        },
        io
      ).catch((e) => console.error(e));
    }

    return res.json({
      success: true,
      message: `Voucher '${coupon.code}' redeemed successfully! ₹${voucherValue} added to your wallet.`,
      bonusAmount: voucherValue,
      balance: balanceAfter
    });
  } catch (error) {
    console.error('Redeem voucher error:', error);
    return res.status(500).json({ success: false, message: 'Failed to redeem voucher' });
  }
};

// ==========================================
// ADMIN CONTROLLERS FOR COUPON MANAGEMENT
// ==========================================

// @route   GET /api/admin/coupons
// @desc    Get all coupons for admin
// @access  Private (ADMIN only)
exports.getAllCouponsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const { search, status, type } = req.query;

    const query = {};
    if (status === 'ACTIVE') query.isActive = true;
    if (status === 'INACTIVE') query.isActive = false;
    if (type && type !== 'ALL') query.type = type;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ code: regex }, { title: regex }, { description: regex }];
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query)
    ]);

    const activeCount = await Coupon.countDocuments({ isActive: true });
    const vouchersCount = await Coupon.countDocuments({ type: 'VOUCHER' });
    const rechargeCount = await Coupon.countDocuments({ type: 'RECHARGE_BONUS' });

    return res.json({
      success: true,
      coupons,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        totalCoupons: total,
        activeCount,
        rechargeCount,
        vouchersCount
      }
    });
  } catch (error) {
    console.error('Get all coupons admin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};

// @route   POST /api/admin/coupons
// @desc    Create a new coupon or voucher
// @access  Private (ADMIN only)
exports.createCouponAdmin = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      type,
      discountType,
      discountValue,
      minRechargeAmount,
      maxDiscountAmount,
      badge,
      validTill,
      usageLimit,
      perUserLimit,
      isActive
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon title is required' });
    }
    if (discountValue === undefined || discountValue === null || Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Valid discount value is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Coupon with code '${cleanCode}' already exists` });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      title: title.trim(),
      description: description ? description.trim() : '',
      type: type || 'RECHARGE_BONUS',
      discountType: discountType || 'FLAT',
      discountValue: Number(discountValue),
      minRechargeAmount: Number(minRechargeAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      badge: badge ? badge.trim() : 'OFFER',
      validTill: validTill ? new Date(validTill) : null,
      usageLimit: Number(usageLimit) || 0,
      perUserLimit: Number(perUserLimit) || 1,
      isActive: isActive !== false
    });

    return res.status(201).json({
      success: true,
      message: `Coupon '${coupon.code}' created successfully`,
      coupon
    });
  } catch (error) {
    console.error('Create coupon admin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

// @route   PATCH /api/admin/coupons/:id
// @desc    Update coupon details or toggle active status
// @access  Private (ADMIN only)
exports.updateCouponAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    console.error('Update coupon admin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

// @route   DELETE /api/admin/coupons/:id
// @desc    Delete coupon permanently
// @access  Private (ADMIN only)
exports.deleteCouponAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.json({
      success: true,
      message: `Coupon '${coupon.code}' deleted successfully`
    });
  } catch (error) {
    console.error('Delete coupon admin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};

