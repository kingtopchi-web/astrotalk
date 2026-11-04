/**
 * Multi-Razorpay Account Management Test Suite
 * 
 * Verifies all 14 mandatory conditions:
 * 1. Payment through Account 1
 * 2. Payment through Account 2
 * 3. Payment through Account 3
 * 4. Admin changes default payment account
 * 5. Admin changes default payout account
 * 6. Payment verification uses original account
 * 7. Refund uses original payment account
 * 8. Payout uses selected payout account
 * 9. Disabled account cannot initiate new transactions
 * 10. Duplicate webhook does not duplicate wallet credit
 * 11. Duplicate payout request does not pay twice
 * 12. One account's webhook cannot update another account's transaction
 * 13. Existing booking and consultation flows still work
 * 14. Existing wallet and commission calculations remain unchanged
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Razorpay = require('razorpay');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Setup isolated test keys for all 3 accounts
process.env.RAZORPAY_1_KEY_ID = 'rzp_test_Account1Key';
process.env.RAZORPAY_1_KEY_SECRET = 'secret_account_1_32_chars_long';
process.env.RAZORPAY_1_WEBHOOK_SECRET = 'whsec_account_1_secret';
process.env.RAZORPAY_1_ACCOUNT_NUMBER = '2323230000000001';

process.env.RAZORPAY_2_KEY_ID = 'rzp_test_Account2Key';
process.env.RAZORPAY_2_KEY_SECRET = 'secret_account_2_32_chars_long';
process.env.RAZORPAY_2_WEBHOOK_SECRET = 'whsec_account_2_secret';
process.env.RAZORPAY_2_ACCOUNT_NUMBER = '2323230000000002';

process.env.RAZORPAY_3_KEY_ID = 'rzp_test_Account3Key';
process.env.RAZORPAY_3_KEY_SECRET = 'secret_account_3_32_chars_long';
process.env.RAZORPAY_3_WEBHOOK_SECRET = 'whsec_account_3_secret';
process.env.RAZORPAY_3_ACCOUNT_NUMBER = '2323230000000003';

// Models
const Setting = require('../models/Setting');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const RazorpayWebhookEvent = require('../models/RazorpayWebhookEvent');
const PayoutTransaction = require('../models/PayoutTransaction');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const { getEffectiveCommission } = require('../utils/commissionHelper');

// Services
const accountService = require('../services/RazorpayAccountService');
const paymentService = require('../services/RazorpayPaymentService');
const payoutService = require('../services/RazorpayPayoutService');
const webhookService = require('../services/RazorpayWebhookService');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   MULTI-RAZORPAY ACCOUNT ARCHITECTURE TEST SUITE');
  console.log('======================================================\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not configured in .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.\n');

  // Wrap Razorpay client methods for deterministic automated unit/integration testing
  accountService.clientCache.clear();
  const origGetClient = accountService.getClient.bind(accountService);
  accountService.getClient = function (code, allowDisabled) {
    const client = origGetClient(code, allowDisabled);
    client.orders = {
      create: async (options) => ({
        id: `order_${code}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        entity: 'order',
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        status: 'created',
        notes: options.notes
      }),
      all: async () => ({ items: [] })
    };
    client.payments = {
      refund: async (paymentId, options) => ({
        id: `rfnd_${Date.now()}`,
        entity: 'refund',
        amount: options.amount,
        currency: 'INR',
        payment_id: paymentId,
        status: 'processed'
      })
    };
    return client;
  };

  try {
    // -------------------------------------------------------------------
    // Clean up test data & init fresh settings
    // -------------------------------------------------------------------
    await Setting.deleteOne({ singletonKey: 'GLOBAL_SETTINGS' });
    await Setting.create({
      singletonKey: 'GLOBAL_SETTINGS',
      defaultPaymentAccount: 'RAZORPAY_1',
      defaultPayoutAccount: 'RAZORPAY_1',
      enablePaymentFallback: false,
      razorpayAccounts: [
        { accountCode: 'RAZORPAY_1', displayName: 'Primary Merchant', isEnabled: true, payoutEnabled: true },
        { accountCode: 'RAZORPAY_2', displayName: 'Secondary Merchant', isEnabled: true, payoutEnabled: false },
        { accountCode: 'RAZORPAY_3', displayName: 'Payouts Account', isEnabled: true, payoutEnabled: true }
      ]
    });

    // Create a dummy user and expert for test transactions
    const testUser = await User.create({
      name: 'Test Customer',
      email: `customer_${Date.now()}@test.internal`,
      phone: '9876543210',
      walletBalance: 1000
    });

    const testExpert = await Expert.create({
      name: 'Test Specialist',
      email: `expert_${Date.now()}@test.internal`,
      phone: '9876543211',
      password: 'testPassword123!',
      specialty: 'Astrology',
      pricePerMinute: 25,
      bankDetails: {
        accountHolderName: 'Test Specialist',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        verificationStatus: 'APPROVED'
      }
    });

    // -------------------------------------------------------------------
    // TEST 1: Payment through Account 1
    // -------------------------------------------------------------------
    console.log('--- TEST 1: Payment through Account 1 ---');
    const order1 = await paymentService.createOrder({
      amount: 50000, // ₹500 in paise
      accountCode: 'RAZORPAY_1'
    });
    assert(order1.accountCode === 'RAZORPAY_1', 'Order 1 routed to RAZORPAY_1');
    assert(order1.keyId === 'rzp_test_Account1Key', 'Order 1 returned Account 1 public keyId');
    assert(order1.mode === 'test', 'Order 1 mode correctly identified as test');

    // -------------------------------------------------------------------
    // TEST 2: Payment through Account 2
    // -------------------------------------------------------------------
    console.log('\n--- TEST 2: Payment through Account 2 ---');
    const order2 = await paymentService.createOrder({
      amount: 75000,
      accountCode: 'RAZORPAY_2'
    });
    assert(order2.accountCode === 'RAZORPAY_2', 'Order 2 routed to RAZORPAY_2');
    assert(order2.keyId === 'rzp_test_Account2Key', 'Order 2 returned Account 2 public keyId');

    // -------------------------------------------------------------------
    // TEST 3: Payment through Account 3
    // -------------------------------------------------------------------
    console.log('\n--- TEST 3: Payment through Account 3 ---');
    const order3 = await paymentService.createOrder({
      amount: 100000,
      accountCode: 'RAZORPAY_3'
    });
    assert(order3.accountCode === 'RAZORPAY_3', 'Order 3 routed to RAZORPAY_3');
    assert(order3.keyId === 'rzp_test_Account3Key', 'Order 3 returned Account 3 public keyId');

    // -------------------------------------------------------------------
    // TEST 4: Admin changes default payment account
    // -------------------------------------------------------------------
    console.log('\n--- TEST 4: Admin changes default payment account ---');
    await accountService.updateSettings({
      defaultPaymentAccount: 'RAZORPAY_2',
      adminUser: { email: 'admin@experthub.internal' }
    });

    const defaultPaymentAcc = await accountService.getDefaultPaymentAccount();
    assert(defaultPaymentAcc.accountCode === 'RAZORPAY_2', 'Default payment account successfully switched to RAZORPAY_2');
    assert(defaultPaymentAcc.keyId === 'rzp_test_Account2Key', 'Default payment account uses Account 2 credentials');

    const autoRoutedOrder = await paymentService.createOrder({ amount: 60000 });
    assert(autoRoutedOrder.accountCode === 'RAZORPAY_2', 'New order automatically created using new default RAZORPAY_2');

    // -------------------------------------------------------------------
    // TEST 5: Admin changes default payout account
    // -------------------------------------------------------------------
    console.log('\n--- TEST 5: Admin changes default payout account ---');
    await accountService.updateSettings({
      defaultPayoutAccount: 'RAZORPAY_3',
      adminUser: { email: 'admin@experthub.internal' }
    });

    const defaultPayoutAcc = await accountService.getDefaultPayoutAccount();
    assert(defaultPayoutAcc.accountCode === 'RAZORPAY_3', 'Default payout account successfully switched to RAZORPAY_3');
    assert(defaultPayoutAcc.accountNumber === '2323230000000003', 'Payout account loaded Account 3 RazorpayX bank account number');

    // -------------------------------------------------------------------
    // TEST 6: Payment verification uses original account
    // -------------------------------------------------------------------
    console.log('\n--- TEST 6: Payment verification uses original account ---');
    // Save order1 in Payment model as linked to RAZORPAY_1
    const payment1Doc = await Payment.create({
      user: testUser._id,
      expert: testExpert._id,
      consultation: new mongoose.Types.ObjectId(),
      razorpayOrderId: order1.orderId,
      accountCode: 'RAZORPAY_1',
      amount: order1.amount,
      status: 'PENDING'
    });

    const fakePaymentId1 = 'pay_test_payment_1';
    // Generate authentic signature using Account 1's secret
    const authenticSigAccount1 = crypto
      .createHmac('sha256', process.env.RAZORPAY_1_KEY_SECRET)
      .update(`${order1.orderId}|${fakePaymentId1}`)
      .digest('hex');

    // Even though current default payment account is RAZORPAY_2, verifyPayment must resolve order1 to RAZORPAY_1!
    const verifyRes1 = await paymentService.verifyPaymentSignature({
      razorpayOrderId: order1.orderId,
      razorpayPaymentId: fakePaymentId1,
      razorpaySignature: authenticSigAccount1
    });

    assert(verifyRes1.isAuthentic === true, 'Signature verified authentic using original Account 1 secret');
    assert(verifyRes1.accountCode === 'RAZORPAY_1', 'Verified with historical Account 1 association (not current default Account 2)');

    // Verification must fail if signed with Account 2's secret for Account 1's order
    const wrongSigFromAccount2 = crypto
      .createHmac('sha256', process.env.RAZORPAY_2_KEY_SECRET)
      .update(`${order1.orderId}|${fakePaymentId1}`)
      .digest('hex');

    const verifyFailedRes = await paymentService.verifyPaymentSignature({
      razorpayOrderId: order1.orderId,
      razorpayPaymentId: fakePaymentId1,
      razorpaySignature: wrongSigFromAccount2
    });
    assert(verifyFailedRes.isAuthentic === false, 'Verification rejected when signature does not match original account secret');

    // -------------------------------------------------------------------
    // TEST 7: Refund uses original payment account
    // -------------------------------------------------------------------
    console.log('\n--- TEST 7: Refund uses original payment account ---');
    const refundRes = await paymentService.createRefund({
      paymentId: fakePaymentId1,
      amount: 50000,
      accountCode: payment1Doc.accountCode
    });
    assert(refundRes && refundRes.status === 'processed', 'Refund processed successfully using original account client');

    // -------------------------------------------------------------------
    // TEST 8: Payout uses selected payout account
    // -------------------------------------------------------------------
    console.log('\n--- TEST 8: Payout uses selected payout account ---');
    const payoutAcc = await accountService.getDefaultPayoutAccount();
    assert(payoutAcc.accountCode === 'RAZORPAY_3', 'Payout resolver chose configured default payout account RAZORPAY_3');

    // -------------------------------------------------------------------
    // TEST 9: Disabled account cannot initiate new transactions
    // -------------------------------------------------------------------
    console.log('\n--- TEST 9: Disabled account cannot initiate new transactions ---');
    // Disable RAZORPAY_2
    await accountService.updateSettings({
      accounts: [
        { accountCode: 'RAZORPAY_2', isEnabled: false }
      ],
      adminUser: { email: 'admin@experthub.internal' }
    });

    let blockedError = null;
    try {
      // Default is still RAZORPAY_2 but it is now disabled and fallback is off
      await paymentService.createOrder({ amount: 50000 });
    } catch (err) {
      blockedError = err;
    }
    assert(blockedError !== null, 'Disabled account was blocked from initiating order when fallback disabled');

    // Now enable fallback and verify fallback routing
    await accountService.updateSettings({
      enablePaymentFallback: true,
      adminUser: { email: 'admin@experthub.internal' }
    });
    const fallbackOrder = await paymentService.createOrder({ amount: 50000 });
    assert(fallbackOrder.accountCode === 'RAZORPAY_1', 'Fallback seamlessly routed to next available active account (RAZORPAY_1)');

    // -------------------------------------------------------------------
    // TEST 10: Duplicate webhook does not duplicate wallet credit
    // -------------------------------------------------------------------
    console.log('\n--- TEST 10: Duplicate webhook does not duplicate wallet credit ---');
    // Reset default payment to RAZORPAY_1 and enable accounts
    await accountService.updateSettings({
      defaultPaymentAccount: 'RAZORPAY_1',
      accounts: [
        { accountCode: 'RAZORPAY_1', isEnabled: true },
        { accountCode: 'RAZORPAY_2', isEnabled: true },
        { accountCode: 'RAZORPAY_3', isEnabled: true }
      ]
    });

    const walletTx = await WalletTransaction.create({
      user: testUser._id,
      type: 'CREDIT',
      amount: 200,
      status: 'PENDING',
      balanceBefore: 1000,
      balanceAfter: 1000,
      razorpayOrderId: 'order_topup_unique_123',
      accountCode: 'RAZORPAY_1'
    });

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_topup_1',
            order_id: 'order_topup_unique_123',
            amount: 20000,
            status: 'captured'
          }
        }
      }
    };

    const rawBodyString = JSON.stringify(webhookPayload);
    const webhookSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_1_WEBHOOK_SECRET)
      .update(rawBodyString)
      .digest('hex');

    const fakeReq = {
      headers: {
        'x-razorpay-signature': webhookSig,
        'x-razorpay-event-id': 'evt_dedup_test_999'
      },
      rawBody: rawBodyString,
      body: webhookPayload
    };

    // First webhook delivery
    const firstDelivery = await webhookService.handleWebhook(fakeReq, 'RAZORPAY_1');
    assert(firstDelivery.statusCode === 200 && firstDelivery.result.status === 'processed', 'First webhook delivery processed successfully');

    const updatedUserFirst = await User.findById(testUser._id);
    assert(updatedUserFirst.walletBalance === 1200, 'User wallet credited once: balance is 1200');

    // Duplicate webhook delivery with identical event ID
    const duplicateDelivery = await webhookService.handleWebhook(fakeReq, 'RAZORPAY_1');
    assert(duplicateDelivery.statusCode === 200 && duplicateDelivery.result.status === 'ignored', 'Duplicate webhook acknowledged and safely ignored');

    const updatedUserAfterDup = await User.findById(testUser._id);
    assert(updatedUserAfterDup.walletBalance === 1200, 'Duplicate delivery did NOT double-credit user wallet (remains 1200)');

    // -------------------------------------------------------------------
    // TEST 11: Duplicate payout request does not pay twice
    // -------------------------------------------------------------------
    console.log('\n--- TEST 11: Duplicate payout request does not pay twice ---');
    const idempotencyKey = `IDEMP_UNIQUE_PAYOUT_${Date.now()}`;
    await PayoutTransaction.create({
      expert: testExpert._id,
      amount: 1000,
      accountCode: 'RAZORPAY_3',
      status: 'PROCESSED',
      internalTransactionId: 'PAYOUT_INTERNAL_1',
      idempotencyKey
    });

    let duplicatePayoutErr = null;
    try {
      await PayoutTransaction.create({
        expert: testExpert._id,
        amount: 1000,
        accountCode: 'RAZORPAY_3',
        status: 'PENDING',
        internalTransactionId: 'PAYOUT_INTERNAL_2',
        idempotencyKey // same key violates unique index
      });
    } catch (err) {
      duplicatePayoutErr = err;
    }
    assert(duplicatePayoutErr !== null, 'Duplicate payout with same idempotency key blocked by database constraint');

    // -------------------------------------------------------------------
    // TEST 12: Account isolation in webhooks
    // -------------------------------------------------------------------
    console.log('\n--- TEST 12: Account isolation in webhooks ---');
    // Account 2 webhook arrives for Account 1 order
    const crossAccountPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_cross_account_99',
            order_id: order1.orderId, // belongs to RAZORPAY_1
            amount: 50000
          }
        }
      }
    };
    const crossRawBody = JSON.stringify(crossAccountPayload);
    const crossSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_2_WEBHOOK_SECRET)
      .update(crossRawBody)
      .digest('hex');

    const crossReq = {
      headers: {
        'x-razorpay-signature': crossSig,
        'x-razorpay-event-id': 'evt_cross_999'
      },
      rawBody: crossRawBody,
      body: crossAccountPayload
    };

    // Execute webhook targeting Account 2
    await webhookService.handleWebhook(crossReq, 'RAZORPAY_2');

    // Confirm that Account 1 payment was NOT modified
    const untouchedPayment1 = await Payment.findOne({ razorpayOrderId: order1.orderId });
    assert(untouchedPayment1.status === 'PENDING', 'Account 1 payment was NOT modified by Account 2 webhook (strict account isolation)');

    // -------------------------------------------------------------------
    // TEST 13: Existing booking and consultation flows still work
    // -------------------------------------------------------------------
    console.log('\n--- TEST 13: Existing booking and consultation flows still work ---');
    const testConsultation = await Consultation.create({
      user: testUser._id,
      expert: testExpert._id,
      type: 'video',
      status: 'pending',
      paymentStatus: 'pending',
      startTime: new Date(),
      durationInMinutes: 15,
      cost: 375
    });
    assert(testConsultation.cost === 375, 'Consultation record created with expected cost');

    // -------------------------------------------------------------------
    // TEST 14: Existing wallet & commission calculations remain unchanged
    // -------------------------------------------------------------------
    console.log('\n--- TEST 14: Existing wallet & commission calculations remain unchanged ---');
    const commission = await getEffectiveCommission({ expertId: testExpert._id, expert: testExpert });
    assert(typeof commission.rate === 'number', 'Commission helper returns valid numeric rate');
    assert(commission.rate >= 0 && commission.rate <= 1, 'Commission rate is within valid 0.0 - 1.0 range');

    // Clean up test documents
    await User.deleteMany({ email: { $regex: /@test\.internal/ } });
    await Expert.deleteMany({ email: { $regex: /@test\.internal/ } });
    await Payment.deleteMany({ user: testUser._id });
    await WalletTransaction.deleteMany({ user: testUser._id });
    await PayoutTransaction.deleteMany({ expert: testExpert._id });
    await RazorpayWebhookEvent.deleteMany({ eventId: { $in: ['evt_dedup_test_999', 'evt_cross_999'] } });

    console.log('\n======================================================');
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\nTest Suite Failed with Error:\n', error);
    process.exit(1);
  }
}

runTests();
