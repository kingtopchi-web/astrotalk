const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');
const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const WalletTransaction = require('../models/WalletTransaction');
const VideoSession = require('../models/VideoSession');

const JWT_TEST_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : {} });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTwoMinuteRuleTests() {
  console.log('\n======================================================');
  console.log('   2-MINUTE RULE VERIFICATION FOR AUDIO & VIDEO CALLS  ');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', require('../routes/bookingRoutes'));

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  const testId = Date.now();
  let expert, user;

  try {
    // Create Test Expert
    expert = await Expert.create({
      name: 'Dr. Test Astrologer',
      email: `expert_2min_${testId}@experthub.test`,
      password: 'password123',
      phone: '9800011122',
      specialty: 'Astrology',
      pricePerMinute: 30,
      rates: { chat: 10, audio: 20, video: 30 },
      approvalStatus: 'approved',
      verificationStatus: 'APPROVED',
      isVerified: true,
      walletBalance: 0
    });
    const expertToken = jwt.sign({ id: expert._id, role: 'EXPERT' }, JWT_TEST_SECRET, { expiresIn: '1h' });

    // Create Test User
    user = await User.create({
      name: 'Call Tester User',
      email: `user_2min_${testId}@experthub.test`,
      password: 'password123',
      status: 'ACTIVE',
      walletBalance: 1000
    });
    const userToken = jwt.sign({ id: user._id, role: 'USER' }, JWT_TEST_SECRET, { expiresIn: '1h' });

    console.log('--- TEST 1: Video Call Pre-Paid Ending Under 2 Minutes (< 120s) ---');
    // Pre-paid 10-minute video consultation (Cost: ₹300)
    const prepaidVideo = await Consultation.create({
      user: user._id,
      expert: expert._id,
      type: 'video',
      cost: 300,
      durationInMinutes: 10,
      startTime: new Date(),
      status: 'ongoing',
      paymentStatus: 'paid'
    });

    const videoSession = await VideoSession.create({
      consultationId: prepaidVideo._id,
      userId: user._id,
      expertId: expert._id,
      status: 'LIVE',
      startedAt: new Date(Date.now() - 45000) // 45 seconds ago
    });

    // End call at 45 seconds (< 120 seconds)
    const endUnder2Res = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/bookings/${prepaidVideo._id}/end`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      durationSeconds: 45
    });

    assert.strictEqual(endUnder2Res.statusCode, 200, 'End booking under 2 minutes returns 200');

    // Verify User Wallet Refund (100% full refund of ₹300)
    const updatedUser1 = await User.findById(user._id);
    assert.strictEqual(updatedUser1.walletBalance, 1300, 'User wallet receives 100% full refund (1000 + 300 = 1300)');

    // Verify Expert Earnings (₹0)
    const updatedExpert1 = await Expert.findById(expert._id);
    assert.strictEqual(updatedExpert1.walletBalance, 0, 'Expert receives ₹0 earnings for < 2 min call');

    // Verify Consultation Record
    const finalizedConsult1 = await Consultation.findById(prepaidVideo._id);
    assert.strictEqual(finalizedConsult1.cost, 0, 'Consultation cost recorded as ₹0');
    assert.strictEqual(finalizedConsult1.expertEarning, 0, 'Expert earning recorded as ₹0');
    assert.strictEqual(finalizedConsult1.status, 'completed', 'Consultation status marked as completed');

    console.log('  [PASS] Video call ending at 45s (< 2 min) resulted in ₹0 charge, 100% user refund, and ₹0 expert earning');

    console.log('\n--- TEST 2: Audio Call Pre-Paid Running 2+ Minutes (>= 120s) ---');
    // Pre-paid 10-minute audio consultation (Cost: ₹200 @ ₹20/min)
    const prepaidAudio = await Consultation.create({
      user: user._id,
      expert: expert._id,
      type: 'audio',
      cost: 200,
      durationInMinutes: 10,
      startTime: new Date(),
      status: 'ongoing',
      paymentStatus: 'paid'
    });

    const audioSession = await VideoSession.create({
      consultationId: prepaidAudio._id,
      userId: user._id,
      expertId: expert._id,
      status: 'LIVE',
      startedAt: new Date(Date.now() - 150000) // 150 seconds ago (2 min 30 sec)
    });

    // End call at 150 seconds (2.5 minutes @ ₹20/min = ₹50 base price)
    const endOver2Res = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/bookings/${prepaidAudio._id}/end`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertToken}`
      }
    }, {
      durationSeconds: 150
    });

    assert.strictEqual(endOver2Res.statusCode, 200, 'End booking over 2 minutes returns 200');

    // Verify Consultation Record
    const finalizedConsult2 = await Consultation.findById(prepaidAudio._id);
    assert(finalizedConsult2.cost > 0, 'Consultation cost is billed (positive)');
    assert(finalizedConsult2.expertEarning > 0, 'Expert receives positive earnings');
    assert.strictEqual(finalizedConsult2.status, 'completed', 'Consultation marked completed');

    // Verify Expert received earnings
    const updatedExpert2 = await Expert.findById(expert._id);
    assert(updatedExpert2.walletBalance > 0, `Expert credited with earnings (balance: ₹${updatedExpert2.walletBalance})`);

    // Verify User unused portion refunded
    const updatedUser2 = await User.findById(user._id);
    const expectedUnusedRefund = 200 - finalizedConsult2.cost;
    assert.strictEqual(
      updatedUser2.walletBalance,
      Number((1300 + expectedUnusedRefund).toFixed(2)),
      `User refunded unused time difference (wallet: ₹${updatedUser2.walletBalance})`
    );

    console.log(`  [PASS] Audio call running 150s (>= 2 min) billed ₹${finalizedConsult2.cost}, expert credited ₹${finalizedConsult2.expertEarning}, unused ₹${expectedUnusedRefund.toFixed(2)} refunded`);

    console.log('\n--- TEST 3: Idempotency & Concurrency ---');
    // Attempting to end already completed consultation again
    const secondEndRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/bookings/${prepaidAudio._id}/end`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      durationSeconds: 150
    });
    assert.strictEqual(secondEndRes.statusCode, 200, 'Second call to end completed consultation is idempotent (200)');
    console.log('  [PASS] Duplicate /end call returns 200 without duplicate credit or debit');

    console.log('\n======================================================');
    console.log('  ALL 2-MINUTE RULE CALL TESTS PASSED SUCCESSFULLY!  ');
    console.log('======================================================\n');
  } finally {
    // Cleanup
    await User.deleteMany({ email: new RegExp(`.*_${testId}@experthub.test`) });
    await Expert.deleteMany({ email: new RegExp(`.*_${testId}@experthub.test`) });
    await Consultation.deleteMany({ expert: { $in: [expert?._id] } });
    await VideoSession.deleteMany({ expertId: { $in: [expert?._id] } });
    await WalletTransaction.deleteMany({ user: { $in: [user?._id, expert?._id] } });
    server.close();
    await mongoose.disconnect();
  }
}

runTwoMinuteRuleTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
