const accountService = require('../services/RazorpayAccountService');
const payoutService = require('../services/RazorpayPayoutService');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const PayoutTransaction = require('../models/PayoutTransaction');

/**
 * GET /api/admin/razorpay/accounts
 * Return sanitized list of all 3 accounts, active defaults, and audit logs
 */
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await accountService.getSanitizedAccountList();
    const settings = await accountService.getSettings();

    res.json({
      success: true,
      defaultPaymentAccount: settings.defaultPaymentAccount,
      defaultPayoutAccount: settings.defaultPayoutAccount,
      enablePaymentFallback: settings.enablePaymentFallback,
      accounts,
      auditLogs: settings.auditLogs
    });
  } catch (error) {
    console.error('Error fetching Razorpay accounts:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve Razorpay accounts', error: error.message });
  }
};

/**
 * PUT /api/admin/razorpay/accounts
 * Update account settings, active defaults, and fallback preferences
 */
exports.updateSettings = async (req, res) => {
  try {
    const { defaultPaymentAccount, defaultPayoutAccount, enablePaymentFallback, accounts } = req.body;

    const updatedAccounts = await accountService.updateSettings({
      defaultPaymentAccount,
      defaultPayoutAccount,
      enablePaymentFallback,
      accounts,
      adminUser: req.user
    });

    res.json({
      success: true,
      message: 'Razorpay configuration updated successfully',
      accounts: updatedAccounts
    });
  } catch (error) {
    console.error('Error updating Razorpay settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};

/**
 * POST /api/admin/razorpay/accounts/:accountCode/test
 * Test credentials and API connectivity for a specific account safely
 */
exports.testConnection = async (req, res) => {
  try {
    const { accountCode } = req.params;
    const result = await accountService.testConnection(accountCode);

    res.json(result);
  } catch (error) {
    console.error('Error testing Razorpay connection:', error);
    res.status(500).json({ success: false, message: 'Connection test failed', error: error.message });
  }
};

/**
 * GET /api/admin/razorpay/reports
 * Comprehensive account-wise transaction reporting
 */
exports.getReports = async (req, res) => {
  try {
    const { accountCode, startDate, endDate, transactionType } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // 1. Payment Query
    const paymentQuery = { ...dateFilter };
    if (accountCode && accountCode !== 'ALL') {
      paymentQuery.accountCode = accountCode;
    }

    const payments = await Payment.find(paymentQuery).select('amount currency status accountCode mode createdAt');

    // 2. Wallet Transactions (Top-ups)
    const walletQuery = { type: 'CREDIT', ...dateFilter };
    if (accountCode && accountCode !== 'ALL') {
      walletQuery.accountCode = accountCode;
    }
    const walletTopups = await WalletTransaction.find(walletQuery).select('amount currency status accountCode mode createdAt');

    // 3. Payout Transactions
    const payoutQuery = { ...dateFilter };
    if (accountCode && accountCode !== 'ALL') {
      payoutQuery.accountCode = accountCode;
    }
    const payouts = await PayoutTransaction.find(payoutQuery).populate('expert', 'name email mobile');

    // Aggregate statistics account-wise
    const accountStats = {
      RAZORPAY_1: { paymentsCount: 0, paymentsAmount: 0, successCount: 0, failedCount: 0, payoutsCount: 0, payoutsAmount: 0 },
      RAZORPAY_2: { paymentsCount: 0, paymentsAmount: 0, successCount: 0, failedCount: 0, payoutsCount: 0, payoutsAmount: 0 },
      RAZORPAY_3: { paymentsCount: 0, paymentsAmount: 0, successCount: 0, failedCount: 0, payoutsCount: 0, payoutsAmount: 0 }
    };

    let totalPaymentVolume = 0;
    let totalPayoutVolume = 0;
    let totalSuccessPayments = 0;
    let totalFailedPayments = 0;

    payments.forEach(p => {
      const code = p.accountCode || 'RAZORPAY_1';
      if (accountStats[code]) {
        accountStats[code].paymentsCount++;
        const inRupees = p.amount / 100;
        if (p.status === 'SUCCESS') {
          accountStats[code].successCount++;
          accountStats[code].paymentsAmount += inRupees;
          totalPaymentVolume += inRupees;
          totalSuccessPayments++;
        } else if (p.status === 'FAILED') {
          accountStats[code].failedCount++;
          totalFailedPayments++;
        }
      }
    });

    walletTopups.forEach(w => {
      const code = w.accountCode || 'RAZORPAY_1';
      if (accountStats[code]) {
        accountStats[code].paymentsCount++;
        if (w.status === 'SUCCESS') {
          accountStats[code].successCount++;
          accountStats[code].paymentsAmount += w.amount;
          totalPaymentVolume += w.amount;
          totalSuccessPayments++;
        } else if (w.status === 'FAILED') {
          accountStats[code].failedCount++;
          totalFailedPayments++;
        }
      }
    });

    payouts.forEach(po => {
      const code = po.accountCode || 'RAZORPAY_1';
      if (accountStats[code]) {
        accountStats[code].payoutsCount++;
        if (po.status === 'PROCESSED') {
          accountStats[code].payoutsAmount += po.amount;
          totalPayoutVolume += po.amount;
        }
      }
    });

    res.json({
      success: true,
      summary: {
        totalPaymentVolume,
        totalPayoutVolume,
        totalSuccessPayments,
        totalFailedPayments,
        totalPayoutsCount: payouts.length,
        payoutsPending: payouts.filter(p => p.status === 'PENDING' || p.status === 'QUEUED' || p.status === 'PROCESSING').length,
        payoutsFailed: payouts.filter(p => p.status === 'FAILED' || p.status === 'REVERSED').length
      },
      accountStats,
      recentPayouts: payouts.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching Razorpay reports:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
  }
};

/**
 * POST /api/admin/razorpay/payouts/initiate
 * Trigger payout to expert using selected or default account
 */
exports.initiateExpertPayout = async (req, res) => {
  try {
    const { expertId, amount, accountCode, notes } = req.body;
    if (!expertId || !amount) {
      return res.status(400).json({ success: false, message: 'expertId and amount are required' });
    }

    const result = await payoutService.initiatePayout({
      expertId,
      amount,
      overrideAccountCode: accountCode,
      notes,
      adminUser: req.user
    });

    res.json({
      success: true,
      message: 'Payout initiated successfully',
      payout: result
    });
  } catch (error) {
    console.error('Error initiating payout:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/razorpay/payouts
 * List all expert payout requests
 */
exports.getPayouts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    const payouts = await PayoutTransaction.find(filter)
      .populate('expert', 'name email phone mobile specialty bankDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts', error: error.message });
  }
};

/**
 * POST /api/admin/razorpay/payouts/:id/process
 * Approve and execute payout (either via RazorpayX auto-transfer or Manual bank transfer confirmation)
 */
exports.processPayoutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'auto_razorpay', overrideAccountCode, referenceNumber } = req.body;

    const payout = await PayoutTransaction.findById(id).populate('expert');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout record not found' });

    if (payout.status === 'PROCESSED') {
      return res.status(400).json({ success: false, message: 'Payout is already processed and completed.' });
    }

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    if (mode === 'manual_transfer') {
      // Mark as paid manually (Admin transferred via IMPS/NEFT/UPI directly)
      payout.status = 'PROCESSED';
      payout.providerPayoutId = referenceNumber || `MANUAL_${Date.now()}`;
      payout.processedAt = new Date();
      payout.notes = {
        ...payout.notes,
        manualApproval: true,
        referenceNumber,
        processedBy: req.user?.email || 'admin'
      };
      await payout.save();

      // Notify Expert
      await sendNotification({
        recipient: payout.expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Payout Processed Successfully',
        message: `Your requested payout of ₹${payout.amount} has been processed and credited to your registered bank account. (Ref: ${payout.providerPayoutId})`,
        actionText: 'View Earnings',
        link: '/expert/earnings',
        type: 'payout_processed',
        badge: 'Completed'
      }, io).catch(() => {});

      return res.json({
        success: true,
        message: `Payout of ₹${payout.amount} marked as successfully processed!`,
        payout
      });
    }

    // Auto transfer via RazorpayX
    const targetAccountCode = overrideAccountCode || payout.accountCode;
    const result = await payoutService.initiatePayout({
      expertId: payout.expert._id,
      amount: payout.amount,
      overrideAccountCode: targetAccountCode,
      notes: {
        payoutRecordId: payout._id.toString(),
        internalId: payout.internalTransactionId
      },
      adminUser: req.user,
      existingPayoutId: payout._id
    });

    payout.status = result.status || 'PROCESSED';
    payout.accountCode = result.accountCode;
    payout.providerPayoutId = result.providerPayoutId;
    payout.failureReason = undefined;
    payout.processedAt = new Date();
    await payout.save();

    await sendNotification({
      recipient: payout.expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Payout Processed Successfully',
      message: `Your requested payout of ₹${payout.amount} has been processed via RazorpayX. (Ref: ${result.providerPayoutId})`,
      actionText: 'View Earnings',
      link: '/expert/earnings',
      type: 'payout_processed',
      badge: 'Completed'
    }, io).catch(() => {});

    res.json({
      success: true,
      message: result.isSimulated
        ? `Payout of ₹${payout.amount} processed successfully in Test Mode (Ref: ${result.providerPayoutId})!`
        : `Payout of ₹${payout.amount} successfully dispatched via RazorpayX!`,
      payout
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    try {
      const payout = await PayoutTransaction.findById(req.params.id);
      if (payout && payout.status !== 'PROCESSED') {
        payout.status = 'FAILED';
        payout.failureReason = error.message;
        await payout.save();
      }
    } catch (e) {}
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/razorpay/payouts/:id/bank-details
 * Admin quick fix for expert bank details / IFSC code
 */
exports.updatePayoutBankDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { ifscCode, accountNumber, accountHolderName, bankName } = req.body;

    const payout = await PayoutTransaction.findById(id).populate('expert');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout record not found' });

    const cleanIfsc = (ifscCode || '').replace(/\s+/g, '').toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (ifscCode && !ifscRegex.test(cleanIfsc)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC format. Must be an 11-character code (e.g., HDFC0001234 or test IFSC RAZR0000001).'
      });
    }

    if (cleanIfsc) payout.bankDetails.ifscCode = cleanIfsc;
    if (accountNumber) payout.bankDetails.accountNumber = accountNumber.trim();
    if (accountHolderName) payout.bankDetails.accountHolderName = accountHolderName.trim();
    if (bankName) payout.bankDetails.bankName = bankName.trim();
    payout.failureReason = undefined;
    if (payout.status === 'FAILED') {
      payout.status = 'PENDING';
    }
    await payout.save();

    // Also update expert document
    const Expert = require('../models/Expert');
    const expert = await Expert.findById(payout.expert._id || payout.expert);
    if (expert && expert.bankDetails) {
      if (cleanIfsc) expert.bankDetails.ifscCode = cleanIfsc;
      if (accountNumber) expert.bankDetails.accountNumber = accountNumber.trim();
      if (accountHolderName) {
        expert.bankDetails.accountName = accountHolderName.trim();
        expert.bankDetails.accountHolderName = accountHolderName.trim();
      }
      if (bankName) expert.bankDetails.bankName = bankName.trim();
      await expert.save();
    }

    res.json({
      success: true,
      message: 'Bank details updated successfully. You can now retry payout dispatch.',
      payout
    });
  } catch (error) {
    console.error('Error updating payout bank details:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/razorpay/payouts/:id/reject
 * Reject a payout request
 */
exports.rejectPayoutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payout = await PayoutTransaction.findById(id).populate('expert');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

    if (payout.status === 'PROCESSED') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already completed payout.' });
    }

    payout.status = 'CANCELLED';
    payout.failureReason = reason || 'Rejected by Administrator';
    await payout.save();

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');
    await sendNotification({
      recipient: payout.expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Payout Request Rejected',
      message: `Your payout request of ₹${payout.amount} was rejected: "${payout.failureReason}". Funds remain in your earnings balance.`,
      actionText: 'Check Bank Details',
      link: '/expert/settings',
      type: 'payout_failed',
      badge: 'Rejected'
    }, io).catch(() => {});

    res.json({
      success: true,
      message: 'Payout request rejected.',
      payout
    });
  } catch (error) {
    console.error('Error rejecting payout:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

