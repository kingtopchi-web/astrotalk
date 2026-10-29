const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const transactions = await WalletTransaction.find({ user: user._id, status: 'SUCCESS' });
    
    let totalAdded = 0;
    let totalSpent = 0;
    let totalRefunded = 0;
    
    transactions.forEach(t => {
      if (t.type === 'CREDIT') totalAdded += t.amount;
      if (t.type === 'DEBIT') totalSpent += t.amount;
      if (t.type === 'REFUND') totalRefunded += t.amount;
    });

    res.json({
      balance: user.walletBalance,
      totalAdded,
      totalSpent,
      totalRefunded
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'consultation', populate: { path: 'expert', select: 'name' } });

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      transactions,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMoney = async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR
    if (!amount || amount < 10) return res.status(400).json({ message: 'Invalid amount' });

    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `wallet_${req.user._id}_${Date.now()}`,
      notes: {
        type: 'wallet_topup',
        userId: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Initial dummy balanceBefore/After, real ones updated on success
    const transaction = new WalletTransaction({
      user: req.user._id,
      type: 'CREDIT',
      amount: amount,
      status: 'PENDING',
      balanceBefore: 0, 
      balanceAfter: 0,
      description: 'Wallet Top-up',
      razorpayOrderId: order.id,
    });
    
    await transaction.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      const io = req.app.get('io');
      const { sendNotification } = require('../utils/notificationDispatcher');
      sendNotification({
        recipientRole: 'ADMIN',
        recipientModel: 'Admin',
        title: 'Payment Verification Issue',
        message: `Payment verification failed (signature mismatch) for Razorpay Order ${razorpay_order_id}.`,
        actionText: 'Investigate payment',
        link: '/transactions',
        type: 'payment_issue',
        badge: 'Alert'
      }, io).catch(e => console.error(e));

      return res.status(400).json({ message: 'Invalid signature' });
    }

    const transaction = await WalletTransaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    if (transaction.status === 'SUCCESS') {
      return res.json({ message: 'Already verified' });
    }

    // Atomic update
    const user = await User.findOneAndUpdate(
      { _id: transaction.user },
      { $inc: { walletBalance: transaction.amount } },
      { new: false }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + transaction.amount;

    // Update transaction
    transaction.status = 'SUCCESS';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.balanceBefore = balanceBefore;
    transaction.balanceAfter = balanceAfter;
    transaction.completedAt = new Date();
    await transaction.save();

    // Dynamic Notifications
    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    // 1. User Notification: Wallet Update
    await sendNotification({
      recipient: user._id,
      recipientRole: 'USER',
      recipientModel: 'User',
      title: 'Wallet Update',
      message: `Your wallet recharge of ₹${transaction.amount} has been credited. Current balance: ₹${balanceAfter}.`,
      actionText: 'View transactions',
      link: '/wallet',
      type: 'wallet_update',
      badge: 'New'
    }, io);

    // 2. Direct Wallet Recharge Email to User
    if (user.email && user.notificationPreferences?.email?.wallet !== false) {
      const sendEmail = require('../utils/sendEmail');
      const platformName = process.env.FROM_NAME || 'ExpertHub';
      sendEmail({
        email: user.email,
        subject: `₹${transaction.amount} Added to Your Wallet - ${platformName}`,
        message: `Hello ${user.name || 'User'},\n\nYour wallet recharge of ₹${transaction.amount} has been credited.\nCurrent Balance: ₹${balanceAfter}\nTransaction ID: ${transaction._id}`,
        htmlMessage: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #16a34a; padding-bottom: 14px; margin-bottom: 20px;">
              <h2 style="color: #15803d; margin: 0; font-size: 20px; font-weight: 700;">₹${transaction.amount} Added to Your Wallet</h2>
            </div>
            <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${user.name || 'User'}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Your wallet recharge was successful and ₹${transaction.amount} has been credited to your account.
            </p>
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 6px; font-size: 14px; color: #166534;"><strong>Recharge Amount:</strong> ₹${transaction.amount}</p>
              <p style="margin: 0 0 6px; font-size: 14px; color: #166534;"><strong>Updated Balance:</strong> ₹${balanceAfter}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">${platformName} Wallet Notifications</p>
          </div>
        `
      }).catch(e => console.error('Wallet recharge email failed:', e));
    }

    // 3. Admin Notification: Wallet Recharge Successful
    await sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: 'Wallet Recharge Successful',
      message: `User ${user.name || 'User'} added ₹${transaction.amount} to their wallet.`,
      actionText: 'View transaction',
      link: '/transactions',
      type: 'wallet_recharge',
      badge: 'Payment'
    }, io);

    res.json({ success: true, message: 'Payment verified and wallet updated', balance: balanceAfter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.payConsultation = async (req, res) => {
  try {
    const { consultationId } = req.body;
    
    const consultation = await Consultation.findById(consultationId).populate('expert');
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (consultation.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Consultation is already paid' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: consultation.cost } },
      { $inc: { walletBalance: -consultation.cost } },
      { new: false }
    );

    if (!user) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - consultation.cost;

    // Create wallet transaction
    const transaction = new WalletTransaction({
      user: user._id,
      type: 'DEBIT',
      amount: consultation.cost,
      status: 'SUCCESS',
      balanceBefore,
      balanceAfter,
      description: `Payment for consultation with ${consultation.expert.name}`,
      consultation: consultation._id,
      completedAt: new Date()
    });
    await transaction.save();

    // Update consultation
    consultation.paymentStatus = 'paid';
    consultation.status = 'scheduled';
    await consultation.save();

    // Send email in background without blocking response if user enabled wallet emails
    if (user.email && user.notificationPreferences?.email?.wallet !== false) {
      sendEmail({
        email: user.email,
        subject: 'Consultation Payment Successful',
        message: `₹${consultation.cost} was deducted from your wallet for your consultation with ${consultation.expert.name}.`
      }).catch(err => console.error('Email send background error:', err.message));
    }

    res.json({ message: 'Payment successful using Wallet', success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCallOrder = async (req, res) => {
  try {
    const { expertId, minutes, type } = req.body;
    if (!expertId || !minutes || minutes <= 0) return res.status(400).json({ message: 'Invalid data' });

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    let rate = 0;
    if (type === 'video') rate = expert.rates?.video || expert.pricePerMinute || 50;
    else if (type === 'audio') rate = expert.rates?.audio || expert.pricePerMinute || 30;
    else if (type === 'chat') rate = expert.rates?.chat || expert.pricePerMinute || 20;
    else rate = expert.pricePerMinute || 50;

    const amount = rate * minutes;
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `call_${req.user._id}_${Date.now()}`,
      notes: {
        type: 'direct_call',
        userId: req.user._id.toString(),
        expertId: expertId.toString(),
        minutes: minutes.toString(),
        callType: type
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      expertName: expert.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyCallPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, expertId, amount, type, minutes } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !expertId) {
      return res.status(400).json({ message: 'Missing required call payment verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    let rate = 0;
    if (type === 'video') rate = expert.rates?.video || expert.pricePerMinute || 50;
    else if (type === 'audio') rate = expert.rates?.audio || expert.pricePerMinute || 30;
    else if (type === 'chat') rate = expert.rates?.chat || expert.pricePerMinute || 20;
    else rate = expert.pricePerMinute || 50;

    const validatedMinutes = Number(minutes) > 0 ? Number(minutes) : 10;
    const expectedAmount = rate * validatedMinutes;
    // Server-side authoritative amount
    const actualAmount = (typeof amount === 'number' && amount >= expectedAmount) ? amount : expectedAmount;

    // Platform takes 20% fee, expert gets 80%
    const expertEarning = actualAmount * 0.8;
    const platformFee = actualAmount - expertEarning;

    // We do NOT credit the expert here. We wait until the consultation completes to calculate pro-rata.

    // Create a transaction record for the user debit (paid via gateway)
    const userTransaction = new WalletTransaction({
      user: req.user._id,
      type: 'DEBIT',
      amount: actualAmount,
      status: 'SUCCESS',
      balanceBefore: 0, // Since paid directly via gateway
      balanceAfter: 0,
      description: `Direct payment for ${type} with ${expert.name}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      completedAt: new Date()
    });
    await userTransaction.save();

    // Create consultation
    const consultation = new Consultation({
      user: req.user._id,
      expert: expertId,
      type: type || 'video',
      status: 'scheduled',
      paymentStatus: 'paid',
      startTime: new Date(),
      durationInMinutes: validatedMinutes,
      cost: actualAmount,
      expertEarning: expertEarning,
      platformFee: platformFee
    });
    await consultation.save();

    res.json({ success: true, message: 'Payment verified and added to expert wallet', consultationId: consultation._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.payCallWithWallet = async (req, res) => {
  try {
    const { expertId, minutes, type } = req.body;
    if (!expertId || !minutes || minutes <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid call parameters' });
    }

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ success: false, message: 'Expert not found' });

    let rate = 0;
    if (type === 'video') rate = expert.rates?.video || expert.pricePerMinute || 50;
    else if (type === 'audio') rate = expert.rates?.audio || expert.pricePerMinute || 30;
    else if (type === 'chat') rate = expert.rates?.chat || expert.pricePerMinute || 20;
    else rate = expert.pricePerMinute || 50;

    const totalCost = rate * minutes;

    // Atomic debit to prevent race conditions and double spending
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: totalCost } },
      { $inc: { walletBalance: -totalCost } },
      { new: false }
    );

    if (!user) {
      const freshUser = await User.findById(req.user._id);
      return res.status(400).json({
        success: false,
        requiresRecharge: true,
        message: 'Insufficient wallet balance',
        currentBalance: freshUser ? freshUser.walletBalance : 0,
        requiredAmount: totalCost,
        shortfall: totalCost - (freshUser ? freshUser.walletBalance : 0)
      });
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - totalCost;

    // 80% to expert, 20% platform fee
    const expertEarning = totalCost * 0.8;
    const platformFee = totalCost - expertEarning;

    // Record wallet transaction
    const userTransaction = new WalletTransaction({
      user: user._id,
      type: 'DEBIT',
      amount: totalCost,
      status: 'SUCCESS',
      balanceBefore,
      balanceAfter,
      description: `Wallet payment for ${minutes} mins ${type} with ${expert.name}`,
      completedAt: new Date()
    });

    // Create Consultation record
    const consultation = new Consultation({
      user: user._id,
      expert: expertId,
      type: type || 'video',
      status: 'scheduled',
      paymentStatus: 'paid',
      startTime: new Date(),
      durationInMinutes: minutes,
      cost: totalCost,
      expertEarning,
      platformFee
    });
    await consultation.save();

    userTransaction.consultation = consultation._id;
    await userTransaction.save();

    // Dynamic Notifications
    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    // 1. User Notification
    sendNotification({
      recipient: user._id,
      recipientRole: 'USER',
      recipientModel: 'User',
      title: 'Booking Confirmed',
      message: `Your ${type} consultation with ${expert.name} has been paid via wallet (₹${totalCost}).`,
      actionText: 'Open booking details',
      link: '/bookings',
      type: 'booking_confirmed',
      badge: 'New'
    }, io).catch(e => console.error('Booking notification error:', e));

    // 2. Expert Notification
    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'New Consultation Request',
      message: `${user.name || 'A user'} booked a ${minutes}-minute ${type} session.`,
      actionText: 'View request',
      link: '/expert/consultations',
      type: 'consultation_request',
      badge: 'New'
    }, io).catch(e => console.error('Consultation request notification error:', e));

    res.json({
      success: true,
      message: 'Paid successfully from wallet',
      consultationId: consultation._id,
      remainingBalance: balanceAfter
    });
  } catch (error) {
    console.error('Wallet call payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


