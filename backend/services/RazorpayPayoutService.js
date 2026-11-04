const axios = require('axios');
const crypto = require('crypto');
const accountService = require('./RazorpayAccountService');
const PayoutTransaction = require('../models/PayoutTransaction');
const Expert = require('../models/Expert');

class RazorpayPayoutService {
  /**
   * Helper to execute RazorpayX REST API requests using Basic Auth
   */
  async makeRazorpayXRequest({ method, endpoint, data = null, headers = {}, accountCode }) {
    const creds = accountService.getCredentials(accountCode);
    if (!creds.keyId || !creds.keySecret) {
      throw new Error(`Razorpay credentials missing for payout account [${accountCode}]`);
    }

    const authHeader = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    const url = `https://api.razorpay.com/v1${endpoint}`;

    const config = {
      method,
      url,
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 20000,
    };

    if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'patch' || method.toLowerCase() === 'put')) {
      config.data = data;
    }

    return await axios(config);
  }

  /**
   * Create or fetch Razorpay Contact for an expert
   */
  async getOrCreateContact({ expert, accountCode }) {
    const contactPayload = {
      name: expert.name || 'Expert Provider',
      email: expert.email || `expert_${expert._id}@experthub.internal`,
      contact: (expert.phone || expert.mobile || '9999999999').replace(/[^0-9]/g, '').slice(-10),
      type: 'vendor',
      reference_id: `EXP_${expert._id}`,
      notes: {
        expertId: expert._id.toString(),
        accountCode
      }
    };

    try {
      const response = await this.makeRazorpayXRequest({
        method: 'POST',
        endpoint: '/contacts',
        data: contactPayload,
        accountCode
      });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.description || err.message;
      throw new Error(`Failed to create Razorpay Contact: ${errorMsg}`);
    }
  }

  /**
   * Create Fund Account for expert's verified bank details
   */
  async createFundAccount({ contactId, bankDetails, accountCode }) {
    const holderName = (bankDetails.accountName || bankDetails.accountHolderName || 'Expert').trim();
    const cleanIfsc = (bankDetails.ifscCode || '').replace(/\s+/g, '').toUpperCase();
    const fundPayload = {
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: holderName,
        ifsc: cleanIfsc,
        account_number: String(bankDetails.accountNumber).trim()
      }
    };

    try {
      const response = await this.makeRazorpayXRequest({
        method: 'POST',
        endpoint: '/fund_accounts',
        data: fundPayload,
        accountCode
      });
      return response.data;
    } catch (err) {
      let errorMsg = err.response?.data?.error?.description || err.message;
      if (errorMsg.toLowerCase().includes('invalid ifsc')) {
        errorMsg = `The IFSC code "${cleanIfsc}" is invalid according to Razorpay/RBI branch records. In test mode, please use Razorpay's test IFSC 'RAZR0000001' or a valid real bank IFSC (e.g. HDFC0001234, SBIN0000691). You can also click 'Mark Paid Manually' to complete the payout.`;
      }
      throw new Error(`Failed to create Razorpay Fund Account: ${errorMsg}`);
    }
  }

  /**
   * Initiate idempotent payout with selected account
   */
  async initiatePayout({ expertId, amount, overrideAccountCode = null, notes = {}, adminUser = null, existingPayoutId = null }) {
    if (!amount || amount < 100) {
      throw new Error('Minimum payout amount is ₹100');
    }

    const expert = await Expert.findById(expertId);
    if (!expert) throw new Error('Expert not found');

    const bankDetails = expert.bankDetails;
    if (!bankDetails || bankDetails.verificationStatus !== 'APPROVED') {
      throw new Error('Expert bank details are not approved by Admin. Payouts require approved bank credentials.');
    }

    const holderName = (bankDetails.accountName || bankDetails.accountHolderName || expert.name || '').trim();
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !holderName) {
      throw new Error('Incomplete bank details on expert record (missing account number, IFSC, or account holder name).');
    }

    const cleanIfsc = (bankDetails.ifscCode || '').replace(/\s+/g, '').toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanIfsc)) {
      throw new Error(`Invalid IFSC code format "${bankDetails.ifscCode}". Indian bank IFSC codes must be 11 characters (e.g., HDFC0001234 or Razorpay Test IFSC RAZR0000001). Please update in Expert Settings or use 'Mark Paid Manually'.`);
    }

    // Resolve payout account
    const payoutAccount = await accountService.getDefaultPayoutAccount(overrideAccountCode);
    const accountCode = payoutAccount.accountCode;

    // Use existing PayoutTransaction record or create a new one
    let payoutRecord;
    if (existingPayoutId) {
      payoutRecord = await PayoutTransaction.findById(existingPayoutId);
    }

    const internalTransactionId = payoutRecord?.internalTransactionId || `PAYOUT_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const idempotencyKey = payoutRecord?.idempotencyKey || `IDEMP_${expertId}_${Math.round(amount)}_${Date.now()}`;

    if (!payoutRecord) {
      payoutRecord = new PayoutTransaction({
        expert: expert._id,
        amount: Math.round(amount),
        currency: 'INR',
        accountCode,
        razorpayAccountId: payoutAccount.keyId,
        status: 'PENDING',
        internalTransactionId,
        idempotencyKey,
        bankDetails: {
          accountHolderName: holderName,
          accountNumber: String(bankDetails.accountNumber).trim(),
          ifscCode: cleanIfsc,
          bankName: bankDetails.bankName,
          upiId: bankDetails.upiId
        },
        notes: {
          ...notes,
          initiatedBy: adminUser?.email || 'admin'
        }
      });
    } else {
      payoutRecord.accountCode = accountCode;
      payoutRecord.razorpayAccountId = payoutAccount.keyId;
      payoutRecord.bankDetails = {
        accountHolderName: holderName,
        accountNumber: String(bankDetails.accountNumber).trim(),
        ifscCode: cleanIfsc,
        bankName: bankDetails.bankName,
        upiId: bankDetails.upiId
      };
      payoutRecord.failureReason = undefined;
    }

    await payoutRecord.save();

    try {
      // 1. Create or get Contact
      const contact = await this.getOrCreateContact({ expert, accountCode });
      payoutRecord.providerContactId = contact.id;

      // 2. Create Fund Account
      const fundAccount = await this.createFundAccount({
        contactId: contact.id,
        bankDetails: {
          accountName: holderName,
          accountHolderName: holderName,
          accountNumber: String(bankDetails.accountNumber).trim(),
          ifscCode: cleanIfsc
        },
        accountCode
      });
      payoutRecord.providerFundAccountId = fundAccount.id;

      // 3. Initiate Payout via RazorpayX
      const payoutPayload = {
        account_number: payoutAccount.accountNumber || process.env.RAZORPAYX_ACCOUNT_NUMBER || '2323230000000000',
        fund_account_id: fundAccount.id,
        amount: Math.round(amount * 100), // in paise
        currency: 'INR',
        mode: 'NEFT',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: internalTransactionId,
        narration: 'ExpertHub Consultation Payout',
        notes: {
          expertId: expert._id.toString(),
          internalTransactionId,
          accountCode
        }
      };

      const response = await this.makeRazorpayXRequest({
        method: 'POST',
        endpoint: '/payouts',
        data: payoutPayload,
        headers: {
          'X-Payout-Idempotency': idempotencyKey
        },
        accountCode
      });

      const providerData = response.data;
      payoutRecord.providerPayoutId = providerData.id;
      payoutRecord.status = (providerData.status || 'PENDING').toUpperCase();
      if (providerData.status === 'processed') {
        payoutRecord.processedAt = new Date();
      }

      await payoutRecord.save();

      return {
        success: true,
        transactionId: payoutRecord.internalTransactionId,
        providerPayoutId: payoutRecord.providerPayoutId,
        status: payoutRecord.status,
        accountCode,
        amount: payoutRecord.amount
      };
    } catch (err) {
      const errorDescription = err.response?.data?.error?.description || err.message;

      // Handle standard PG keys missing RazorpayX Banking activation
      const isRazorpayXUnavailable =
        errorDescription.includes('The requested URL was not found on the server') ||
        errorDescription.includes('Access to requested resource not available') ||
        err.response?.status === 404;

      if (isRazorpayXUnavailable && (payoutAccount.keyId || '').startsWith('rzp_test_')) {
        console.warn(`[RazorpayPayoutService] Standard PG test key detected without RazorpayX activation. Simulating sandbox payout for account [${accountCode}].`);
        payoutRecord.providerPayoutId = `pout_test_${Date.now()}`;
        payoutRecord.status = 'PROCESSED';
        payoutRecord.processedAt = new Date();
        payoutRecord.failureReason = undefined;
        payoutRecord.notes = {
          ...notes,
          testModeSimulation: true,
          notice: 'Simulated sandbox payout because standard test keys do not have RazorpayX banking enabled'
        };
        await payoutRecord.save();

        return {
          success: true,
          transactionId: payoutRecord.internalTransactionId,
          providerPayoutId: payoutRecord.providerPayoutId,
          status: 'PROCESSED',
          accountCode,
          amount: payoutRecord.amount,
          isSimulated: true
        };
      }

      let friendlyError = errorDescription;
      if (isRazorpayXUnavailable) {
        friendlyError = 'Automated payouts require RazorpayX Banking (x.razorpay.com). Your configured Razorpay API keys are for standard Payment Gateway (collections only). To approve and complete this payout right now, click "Mark Paid" (Offline Transfer).';
      }

      payoutRecord.status = 'FAILED';
      payoutRecord.failureReason = friendlyError;
      await payoutRecord.save();

      throw new Error(`Payout dispatch failed: ${friendlyError}`);
    }
  }

  /**
   * Get payout status from provider
   */
  async getPayoutStatus({ payoutId, accountCode }) {
    try {
      const response = await this.makeRazorpayXRequest({
        method: 'GET',
        endpoint: `/payouts/${payoutId}`,
        accountCode
      });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch payout status: ${err.message}`);
    }
  }
}

module.exports = new RazorpayPayoutService();
