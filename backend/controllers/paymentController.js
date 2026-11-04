const crypto = require('crypto');
const Payment = require('../models/Payment');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const paymentService = require('../services/RazorpayPaymentService');
const webhookService = require('../services/RazorpayWebhookService');
const sendEmail = require('../utils/sendEmail');

exports.createOrder = async (req, res) => {
  try {
    const { consultationId, useWallet, accountCode } = req.body;
    
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    if (consultation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    let walletAmountToUse = 0;
    let remainingAmount = consultation.cost;

    if (useWallet && user.walletBalance > 0) {
      if (user.walletBalance >= consultation.cost) {
        return res.status(400).json({ message: 'Wallet balance is sufficient. Use pay-consultation endpoint.' });
      } else {
        walletAmountToUse = user.walletBalance;
        remainingAmount = consultation.cost - walletAmountToUse;
      }
    }

    const amountInPaise = Math.round(remainingAmount * 100);

    // Route order creation through multi-account RazorpayPaymentService
    const order = await paymentService.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${consultation._id}`,
      notes: {
        consultationId: consultation._id.toString(),
        userId: req.user._id.toString()
      },
      accountCode: accountCode || null
    });

    const internalTransactionId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const payment = new Payment({
      user: req.user._id,
      expert: consultation.expert,
      consultation: consultation._id,
      razorpayOrderId: order.orderId,
      providerOrderId: order.orderId,
      razorpayAccountId: order.keyId,
      accountCode: order.accountCode,
      transactionType: 'PAYMENT',
      internalTransactionId,
      amount: amountInPaise,
      currency: order.currency,
      status: 'PENDING',
      mode: order.mode,
      walletUsed: walletAmountToUse
    });
    
    await payment.save();

    res.status(200).json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      accountCode: order.accountCode
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment verification fields' });
    }

    // Verify signature using the exact account that created the order
    const verifyResult = await paymentService.verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    if (verifyResult.isAuthentic) {
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id }).populate('user expert');
      
      if (payment && payment.status !== 'SUCCESS') {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.providerPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.accountCode = verifyResult.accountCode;
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        await payment.save();

        const consultation = await Consultation.findById(payment.consultation);
        if (consultation) {
          consultation.paymentStatus = 'paid';
          consultation.status = 'scheduled';
          await consultation.save();
        }

        // Handle partial wallet payment deduction atomically
        if (payment.walletUsed > 0) {
          const User = require('../models/User');
          const WalletTransaction = require('../models/WalletTransaction');
          
          const user = await User.findOneAndUpdate(
            { _id: payment.user._id, walletBalance: { $gte: payment.walletUsed } },
            { $inc: { walletBalance: -payment.walletUsed } },
            { new: false }
          );
          
          if (user) {
            const balanceBefore = user.walletBalance;
            const balanceAfter = balanceBefore - payment.walletUsed;

            const tx = new WalletTransaction({
              user: user._id,
              type: 'DEBIT',
              amount: payment.walletUsed,
              status: 'SUCCESS',
              balanceBefore,
              balanceAfter,
              description: `Partial payment for consultation with ${payment.expert?.name || 'expert'}`,
              consultation: consultation ? consultation._id : null,
              completedAt: new Date()
            });
            await tx.save();
          }
        }

        // Send Email Notification to User if enabled in settings
        if (payment.user && payment.user.email && payment.user.notificationPreferences?.email?.payment !== false) {
          try {
            await sendEmail({
              email: payment.user.email,
              subject: 'Payment Successful & Consultation Confirmed',
              message: `Your payment of ₹${payment.amount / 100} was successful via ${payment.accountCode}. Your consultation with ${payment.expert?.name || 'the expert'} is now confirmed. Order ID: ${payment.razorpayOrderId}`
            });
          } catch (err) {
            console.error('Email sending failed:', err);
          }
        }
      }

      res.status(200).json({ message: 'Payment verified successfully', accountCode: verifyResult.accountCode });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
};

/**
 * Account-aware Webhook handler
 * Supports /webhook and /webhook/:accountCode
 */
exports.webhook = async (req, res) => {
  try {
    const explicitAccountCode = req.params?.accountCode || null;
    const { statusCode, result } = await webhookService.handleWebhook(req, explicitAccountCode);
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
