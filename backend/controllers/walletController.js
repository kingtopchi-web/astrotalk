const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Consultation = require('../models/Consultation');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SBFgUhpkJffWZY',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YKf15utu1cQxRP9WkcHWD5L8'
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
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SBFgUhpkJffWZY'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YKf15utu1cQxRP9WkcHWD5L8')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const transaction = await WalletTransaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    if (transaction.status === 'SUCCESS') {
      return res.json({ message: 'Already verified' });
    }

    // Atomic update
    const user = await User.findById(transaction.user);
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + transaction.amount;
    
    // Update user balance
    user.walletBalance = balanceAfter;
    await user.save();

    // Update transaction
    transaction.status = 'SUCCESS';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.balanceBefore = balanceBefore;
    transaction.balanceAfter = balanceAfter;
    transaction.completedAt = new Date();
    await transaction.save();

    // Send email (optional)
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Wallet Top-up Successful',
          message: `Your wallet top-up of ₹${transaction.amount} was successful.`
        });
      } catch (err) {
        console.log(err);
      }
    }

    res.json({ message: 'Payment verified and wallet updated' });
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

    const user = await User.findById(req.user._id);
    if (user.walletBalance < consultation.cost) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - consultation.cost;
    
    // Atomic update simulation (in prod use session/transactions if replica set)
    user.walletBalance = balanceAfter;
    await user.save();

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

    // Send email
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Consultation Payment Successful',
          message: `₹${consultation.cost} was deducted from your wallet for your consultation with ${consultation.expert.name}.`
        });
      } catch (err) {}
    }

    res.json({ message: 'Payment successful using Wallet' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
