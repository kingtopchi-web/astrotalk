const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SBFgUhpkJffWZY',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YKf15utu1cQxRP9WkcHWD5L8'
});

exports.createOrder = async (req, res) => {
  try {
    const { consultationId, useWallet } = req.body;
    
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

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${consultation._id}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    const payment = new Payment({
      user: req.user._id,
      expert: consultation.expert,
      consultation: consultation._id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'PENDING',
      walletUsed: walletAmountToUse
    });
    
    await payment.save();

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SBFgUhpkJffWZY'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

const sendEmail = require('../utils/sendEmail');

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YKf15utu1cQxRP9WkcHWD5L8')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id }).populate('user').populate('expert');
      if (payment && payment.status !== 'SUCCESS') {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        await payment.save();

        const consultation = await Consultation.findById(payment.consultation);
        if (consultation) {
          consultation.paymentStatus = 'paid';
          consultation.status = 'scheduled';
          await consultation.save();
        }

        // Handle partial wallet payment deduction
        if (payment.walletUsed > 0) {
          const User = require('../models/User');
          const WalletTransaction = require('../models/WalletTransaction');
          const user = await User.findById(payment.user._id);
          
          if (user) {
            const balanceBefore = user.walletBalance;
            const balanceAfter = balanceBefore - payment.walletUsed;
            user.walletBalance = balanceAfter;
            await user.save();

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

        // Send Email Notification to User
        if (payment.user && payment.user.email) {
          try {
            await sendEmail({
              email: payment.user.email,
              subject: 'Payment Successful & Consultation Confirmed',
              message: `Your payment of ₹${payment.amount / 100} was successful. Your consultation with ${payment.expert?.name || 'the expert'} is now confirmed. Order ID: ${payment.razorpayOrderId}`
            });
          } catch (err) {
            console.error('Email sending failed:', err);
          }
        }
      }

      res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentData = payload.payment.entity;
      const orderId = paymentData.order_id;
      
      const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate('user').populate('expert');
      if (payment && payment.status !== 'SUCCESS') {
        payment.status = 'SUCCESS';
        payment.razorpayPaymentId = paymentData.id;
        payment.paidAt = new Date();
        await payment.save();

        const consultation = await Consultation.findByIdAndUpdate(payment.consultation, {
          paymentStatus: 'paid',
          status: 'scheduled'
        });

        // Handle partial wallet payment deduction
        if (payment.walletUsed > 0) {
          const User = require('../models/User');
          const WalletTransaction = require('../models/WalletTransaction');
          const user = await User.findById(payment.user._id);
          
          if (user) {
            const balanceBefore = user.walletBalance;
            const balanceAfter = balanceBefore - payment.walletUsed;
            user.walletBalance = balanceAfter;
            await user.save();

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

        if (payment.user && payment.user.email) {
          await sendEmail({
            email: payment.user.email,
            subject: 'Payment Successful',
            message: `Your payment of ₹${payment.amount / 100} was captured via webhook. Order ID: ${orderId}`
          }).catch(console.error);
        }
      } else {
        // Check if it's a Wallet Top-up
        const WalletTransaction = require('../models/WalletTransaction');
        const User = require('../models/User');
        const walletTx = await WalletTransaction.findOne({ razorpayOrderId: orderId }).populate('user');
        if (walletTx && walletTx.status !== 'SUCCESS') {
           const user = await User.findById(walletTx.user._id);
           if (user) {
             const balanceBefore = user.walletBalance;
             const balanceAfter = balanceBefore + walletTx.amount;
             
             user.walletBalance = balanceAfter;
             await user.save();

             walletTx.status = 'SUCCESS';
             walletTx.razorpayPaymentId = paymentData.id;
             walletTx.balanceBefore = balanceBefore;
             walletTx.balanceAfter = balanceAfter;
             walletTx.completedAt = new Date();
             await walletTx.save();

             if (user.email) {
               await sendEmail({
                 email: user.email,
                 subject: 'Wallet Top-up Successful',
                 message: `Your wallet top-up of ₹${walletTx.amount} was captured via webhook.`
               }).catch(console.error);
             }
           }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentData = payload.payment.entity;
      const orderId = paymentData.order_id;
      
      const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate('user');
      if (payment && payment.status !== 'FAILED') {
        payment.status = 'FAILED';
        await payment.save();

        if (payment.user && payment.user.email) {
          await sendEmail({
            email: payment.user.email,
            subject: 'Payment Failed',
            message: `Your payment of ₹${payment.amount / 100} has failed. Order ID: ${orderId}`
          }).catch(console.error);
        }
      } else {
        const WalletTransaction = require('../models/WalletTransaction');
        const walletTx = await WalletTransaction.findOne({ razorpayOrderId: orderId }).populate('user');
        if (walletTx && walletTx.status !== 'FAILED' && walletTx.status !== 'SUCCESS') {
          walletTx.status = 'FAILED';
          await walletTx.save();
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};
