const crypto = require('crypto');
const accountService = require('./RazorpayAccountService');
const RazorpayWebhookEvent = require('../models/RazorpayWebhookEvent');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const PayoutTransaction = require('../models/PayoutTransaction');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const sendEmail = require('../utils/sendEmail');

class RazorpayWebhookService {
  /**
   * Determine which account code owns a webhook request
   */
  async resolveAccountCode(req, explicitAccountCode = null) {
    if (explicitAccountCode && accountService.accountCodes.includes(explicitAccountCode)) {
      return explicitAccountCode;
    }

    // 1. Check custom header if sent
    const headerAccount = req.headers['x-razorpay-account-code'];
    if (headerAccount && accountService.accountCodes.includes(headerAccount)) {
      return headerAccount;
    }

    // 2. Check body payload notes
    const body = req.body || {};
    const payload = body.payload || {};
    const entity = payload.payment?.entity || payload.order?.entity || payload.payout?.entity;
    const accountFromNotes = entity?.notes?.accountCode;
    if (accountFromNotes && accountService.accountCodes.includes(accountFromNotes)) {
      return accountFromNotes;
    }

    // 3. Check order_id in Payment / WalletTransaction
    const orderId = entity?.order_id || entity?.id;
    if (orderId && orderId.startsWith('order_')) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId }).select('accountCode');
      if (payment?.accountCode) return payment.accountCode;

      const walletTx = await WalletTransaction.findOne({ razorpayOrderId: orderId }).select('accountCode');
      if (walletTx?.accountCode) return walletTx.accountCode;
    }

    // Fallback to default payment account
    const settings = await accountService.getSettings();
    return settings.defaultPaymentAccount || 'RAZORPAY_1';
  }

  /**
   * Verify signature using that account's webhook secret
   */
  verifyWebhookSignature({ rawBody, signature, accountCode }) {
    if (!signature) return false;

    const creds = accountService.getCredentials(accountCode);
    const secret = creds.webhookSecret || creds.keySecret;
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(req, explicitAccountCode = null) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];

    const accountCode = await this.resolveAccountCode(req, explicitAccountCode);

    // 1. Verify HMAC Signature
    const isAuthentic = this.verifyWebhookSignature({
      rawBody,
      signature,
      accountCode
    });

    if (!isAuthentic) {
      return {
        statusCode: 400,
        result: { message: 'Invalid webhook signature for target account', accountCode }
      };
    }

    const body = req.body || {};
    const eventId = req.headers['x-razorpay-event-id'] || body.event_id || body.id || `EVT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const eventType = body.event;

    // 2. Event Deduplication check
    const existingEvent = await RazorpayWebhookEvent.findOne({ eventId, accountCode });
    if (existingEvent) {
      return {
        statusCode: 200,
        result: { status: 'ignored', reason: 'duplicate_event', eventId, accountCode }
      };
    }

    // Record webhook event to prevent replay attacks
    const webhookEvent = new RazorpayWebhookEvent({
      eventId,
      accountCode,
      eventType: eventType || 'unknown',
      status: 'PROCESSED',
      rawPayload: body
    });

    try {
      // 3. Process specific events safely
      const payload = body.payload || {};

      if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
        const paymentEntity = payload.payment?.entity;
        if (paymentEntity) {
          await this.processPaymentSuccess(paymentEntity, accountCode);
        }
      } else if (eventType === 'payment.failed') {
        const paymentEntity = payload.payment?.entity;
        if (paymentEntity) {
          await this.processPaymentFailed(paymentEntity, accountCode);
        }
      } else if (eventType === 'payout.processed') {
        const payoutEntity = payload.payout?.entity;
        if (payoutEntity) {
          await this.processPayoutSuccess(payoutEntity, accountCode);
        }
      } else if (eventType === 'payout.failed' || eventType === 'payout.reversed') {
        const payoutEntity = payload.payout?.entity;
        if (payoutEntity) {
          await this.processPayoutFailure(payoutEntity, eventType, accountCode);
        }
      }

      await webhookEvent.save();

      return {
        statusCode: 200,
        result: { status: 'processed', eventId, accountCode, eventType }
      };
    } catch (err) {
      console.error('[RazorpayWebhookService] Processing error:', err);
      webhookEvent.status = 'FAILED';
      webhookEvent.error = err.message;
      await webhookEvent.save().catch(() => {});

      return {
        statusCode: 500,
        result: { message: 'Error processing webhook event', error: err.message }
      };
    }
  }

  /**
   * Process successful payment capture
   */
  async processPaymentSuccess(paymentEntity, accountCode) {
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    // 1. Process Consultation Payment
    const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate('user expert');
    if (payment) {
      // Strict account boundary: only update if accountCode matches or was legacy unassigned
      if (payment.accountCode && payment.accountCode !== 'UNKNOWN' && payment.accountCode !== accountCode) {
        console.warn(`[RazorpayWebhookService] Account mismatch for order ${orderId}: expected ${payment.accountCode}, got webhook from ${accountCode}`);
        return;
      }

      if (payment.status !== 'SUCCESS') {
        payment.status = 'SUCCESS';
        payment.razorpayPaymentId = paymentId;
        payment.providerPaymentId = paymentId;
        payment.accountCode = accountCode;
        payment.paidAt = new Date();
        await payment.save();

        const consultation = await Consultation.findById(payment.consultation);
        if (consultation) {
          consultation.paymentStatus = 'paid';
          consultation.status = 'scheduled';
          await consultation.save();
        }

        if (payment.walletUsed > 0 && payment.user) {
          await User.findOneAndUpdate(
            { _id: payment.user._id, walletBalance: { $gte: payment.walletUsed } },
            { $inc: { walletBalance: -payment.walletUsed } }
          );
        }
      }
      return;
    }

    // 2. Process Wallet Topup
    const walletTx = await WalletTransaction.findOne({ razorpayOrderId: orderId });
    if (walletTx) {
      if (walletTx.accountCode && walletTx.accountCode !== 'UNKNOWN' && walletTx.accountCode !== accountCode) {
        console.warn(`[RazorpayWebhookService] Wallet account mismatch for order ${orderId}: expected ${walletTx.accountCode}, got ${accountCode}`);
        return;
      }

      if (walletTx.status !== 'SUCCESS') {
        const topupAmount = walletTx.amount;
        const updatedUser = await User.findByIdAndUpdate(
          walletTx.user,
          { $inc: { walletBalance: topupAmount } },
          { new: true }
        );

        if (updatedUser) {
          walletTx.status = 'SUCCESS';
          walletTx.razorpayPaymentId = paymentId;
          walletTx.providerPaymentId = paymentId;
          walletTx.accountCode = accountCode;
          walletTx.balanceBefore = updatedUser.walletBalance - topupAmount;
          walletTx.balanceAfter = updatedUser.walletBalance;
          walletTx.completedAt = new Date();
          await walletTx.save();
        }
      }
    }
  }

  /**
   * Process payment failure
   */
  async processPaymentFailed(paymentEntity, accountCode) {
    const orderId = paymentEntity.order_id;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status === 'PENDING') {
      payment.status = 'FAILED';
      await payment.save();
    }

    const walletTx = await WalletTransaction.findOne({ razorpayOrderId: orderId });
    if (walletTx && walletTx.status === 'PENDING') {
      walletTx.status = 'FAILED';
      await walletTx.save();
    }
  }

  /**
   * Process payout success
   */
  async processPayoutSuccess(payoutEntity, accountCode) {
    const providerPayoutId = payoutEntity.id;
    const payoutRecord = await PayoutTransaction.findOne({
      $or: [
        { providerPayoutId },
        { internalTransactionId: payoutEntity.reference_id }
      ]
    });

    if (payoutRecord && payoutRecord.accountCode === accountCode) {
      payoutRecord.status = 'PROCESSED';
      payoutRecord.providerPayoutId = providerPayoutId;
      payoutRecord.processedAt = new Date();
      await payoutRecord.save();
    }
  }

  /**
   * Process payout failure or reversal
   */
  async processPayoutFailure(payoutEntity, eventType, accountCode) {
    const providerPayoutId = payoutEntity.id;
    const payoutRecord = await PayoutTransaction.findOne({
      $or: [
        { providerPayoutId },
        { internalTransactionId: payoutEntity.reference_id }
      ]
    });

    if (payoutRecord && payoutRecord.accountCode === accountCode) {
      payoutRecord.status = eventType === 'payout.reversed' ? 'REVERSED' : 'FAILED';
      payoutRecord.failureReason = payoutEntity.failure_reason || 'Payout failed at bank/provider';
      if (eventType === 'payout.reversed') {
        payoutRecord.reversedAt = new Date();
      }
      await payoutRecord.save();
    }
  }
}

module.exports = new RazorpayWebhookService();

