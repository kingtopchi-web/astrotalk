const crypto = require('crypto');
const accountService = require('./RazorpayAccountService');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');

class RazorpayPaymentService {
  /**
   * Create Razorpay order using the selected or default payment account
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {}, accountCode = null }) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid order amount');
    }

    let activeAccount;
    if (accountCode) {
      const creds = accountService.getCredentials(accountCode);
      activeAccount = {
        accountCode,
        keyId: creds.keyId,
        mode: accountService.getModeFromKeyId(creds.keyId),
        client: accountService.getClient(accountCode)
      };
    } else {
      activeAccount = await accountService.getDefaultPaymentAccount();
    }

    const payloadNotes = {
      ...notes,
      accountCode: activeAccount.accountCode,
      createdAt: new Date().toISOString()
    };

    const options = {
      amount: Math.round(amount), // in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: payloadNotes,
      payment_capture: 1
    };

    const order = await activeAccount.client.orders.create(options);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: activeAccount.keyId,
      accountCode: activeAccount.accountCode,
      mode: activeAccount.mode
    };
  }

  /**
   * Resolve which account code originally created an order
   */
  async resolveAccountForOrder(razorpayOrderId) {
    // 1. Check in Payment model
    const payment = await Payment.findOne({ razorpayOrderId }).select('accountCode razorpayAccountId');
    if (payment?.accountCode && payment.accountCode !== 'UNKNOWN') {
      return payment.accountCode;
    }

    // 2. Check in WalletTransaction model
    const walletTx = await WalletTransaction.findOne({ razorpayOrderId }).select('accountCode razorpayAccountId');
    if (walletTx?.accountCode && walletTx.accountCode !== 'UNKNOWN') {
      return walletTx.accountCode;
    }

    // 3. Check in MarketplaceOrder model
    try {
      const MarketplaceOrder = require('../models/MarketplaceOrder');
      const mktOrder = await MarketplaceOrder.findOne({ razorpayOrderId }).select('accountCode');
      if (mktOrder?.accountCode && mktOrder.accountCode !== 'UNKNOWN') {
        return mktOrder.accountCode;
      }
    } catch (e) {
      // Ignore if model not yet loaded
    }

    // Default to RAZORPAY_1 for legacy orders created before multi-account support
    return 'RAZORPAY_1';
  }

  /**
   * Verify signature using the exact account's secret key
   */
  async verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature, accountCode = null }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { isAuthentic: false, reason: 'Missing signature fields' };
    }

    const targetAccountCode = accountCode || await this.resolveAccountForOrder(razorpayOrderId);
    const creds = accountService.getCredentials(targetAccountCode);

    if (!creds.keySecret) {
      throw new Error(`Razorpay secret key not configured for account [${targetAccountCode}]`);
    }

    const expectedSignature = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpaySignature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    let isAuthentic = false;
    if (signatureBuffer.length === expectedBuffer.length) {
      isAuthentic = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    }

    return {
      isAuthentic,
      accountCode: targetAccountCode,
      mode: accountService.getModeFromKeyId(creds.keyId)
    };
  }

  /**
   * Process refund on the original merchant account
   */
  async createRefund({ paymentId, amount, notes = {}, accountCode }) {
    if (!paymentId) throw new Error('paymentId is required for refund');
    if (!accountCode) throw new Error('accountCode is required to refund using the original merchant account');

    const client = accountService.getClient(accountCode);
    const refundPayload = {};
    if (amount) refundPayload.amount = Math.round(amount);
    if (notes) refundPayload.notes = notes;

    const refund = await client.payments.refund(paymentId, refundPayload);
    return refund;
  }
}

module.exports = new RazorpayPaymentService();

