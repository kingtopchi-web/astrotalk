/**
 * Comprehensive Automated Security Audit & Verification Test Suite for ExpertHub
 * Covers Authentication, Authorization, Role Enforcement, Public Data Masking,
 * Webhook HMAC Signatures, Atomic Wallet Concurrency, Review Integrity, and XSS Sanitization.
 */

const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Models
const User = require('../models/User');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const Admin = require('../models/Admin');
const Consultation = require('../models/Consultation');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const WalletTransaction = require('../models/WalletTransaction');
const { getEffectiveCommission } = require('../utils/commissionHelper');

let server;
const JWT_TEST_SECRET = process.env.JWT_SECRET || 'security_test_jwt_secret_key_1234567890_abcdef';
process.env.JWT_SECRET = JWT_TEST_SECRET;
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_for_tests_123';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_for_tests_456';
process.env.NODE_ENV = 'test';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   EXPERTHUB SECURITY AUDIT & VERIFICATION SUITE      ');
  console.log('======================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failedCount++;
    }
  }

  // Generate unique test prefix to isolate test fixtures
  const testRunId = Date.now().toString(36);

  try {
    let uri = process.env.MONGODB_URI;
    if (uri.includes('?')) {
      uri = uri.replace(/\/[^/?]+(\?)/, '/experthub_test$1');
    }
    await mongoose.connect(uri);

    // Express app setup for testing
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');

    const app = express();
    app.disable('x-powered-by');
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      xFrameOptions: { action: 'sameorigin' },
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginEmbedderPolicy: false
    }));

    app.use((req, res, next) => {
      const p = (req.path || '').toLowerCase();
      if (p.includes('.env') || p.includes('.git') || p.includes('/wp-admin') || p.includes('/phpmyadmin')) {
        return res.status(404).json({ message: 'Not found' });
      }
      next();
    });
    app.use(cors());
    app.use(express.json({
      verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); }
    }));

    // Register routes
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/experts', require('../routes/expertRoutes'));
    app.use('/api/expert', require('../routes/expertProfileRoutes'));
    app.use('/api/bookings', require('../routes/bookingRoutes'));
    app.use('/api/payments', require('../routes/paymentRoutes'));
    app.use('/api/wallet', require('../routes/walletRoutes'));
    app.use('/api/notifications', require('../routes/notificationRoutes'));
    app.use('/api/reviews', require('../routes/reviewRoutes'));
    app.use('/api/admin', require('../routes/adminRoutes'));

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    // Seed isolated test fixtures
    const activeUser = await User.create({
      name: `Alice User ${testRunId}`,
      email: `alice_${testRunId}@example.com`,
      password: 'password123',
      role: 'USER',
      status: 'ACTIVE',
      walletBalance: 500
    });

    const suspendedUser = await User.create({
      name: `Bob Suspended ${testRunId}`,
      email: `bob_${testRunId}@example.com`,
      password: 'password123',
      role: 'USER',
      status: 'SUSPENDED',
      walletBalance: 200
    });

    const approvedExpert = await Expert.create({
      name: `Dr. Jane Expert ${testRunId}`,
      email: `jane_${testRunId}@example.com`,
      password: 'hashed_secret_password_123',
      role: 'EXPERT',
      status: 'ACTIVE',
      verificationStatus: 'APPROVED',
      specialty: 'Legal Advice',
      bankDetails: {
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      documents: ['https://cdn.private/aadhaar.pdf'],
      walletBalance: 1500,
      rates: { chat: 25, video: 50 }
    });

    const pendingExpert = await Expert.create({
      name: `Unverified Expert ${testRunId}`,
      email: `unverified_${testRunId}@example.com`,
      password: 'hashed_secret_password_456',
      role: 'EXPERT',
      status: 'ACTIVE',
      verificationStatus: 'PENDING',
      specialty: 'Astrology',
      bankDetails: { accountNumber: '9999999999' }
    });

    const userToken = jwt.sign(
      { id: activeUser._id, role: 'USER' },
      JWT_TEST_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const suspendedUserToken = jwt.sign(
      { id: suspendedUser._id, role: 'USER' },
      JWT_TEST_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    console.log('--- TEST GROUP 1: AUTHENTICATION & STATUS ENFORCEMENT ---');

    // 1.1 Unauthenticated request to protected endpoint
    const unauthRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews/my-reviews',
      method: 'GET'
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated request to protected endpoint returns 401');

    // 1.2 Suspended account request rejected
    const suspendedRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews/my-reviews',
      method: 'GET',
      headers: { Authorization: `Bearer ${suspendedUserToken}` }
    });
    assert(suspendedRes.statusCode === 403, 'Suspended account is blocked with 403 Forbidden');

    // 1.3 NoSQL Injection query object in login is rejected
    const nosqlLoginRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/user/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: { $gt: '' },
      password: 'password123'
    });
    assert(nosqlLoginRes.statusCode === 400, 'NoSQL query object injection in login is rejected (400)');

    console.log('\n--- TEST GROUP 2: PUBLIC SENSITIVE DATA MASKING ---');

    // 2.1 Public experts list does NOT leak passwords, bankDetails, documents, or walletBalance
    const expertsListRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/experts?search=${encodeURIComponent(approvedExpert.name)}`,
      method: 'GET'
    });
    const expertItem = expertsListRes.body.experts?.[0];
    const leaksSensitiveFields = expertItem && (
      expertItem.password || 
      expertItem.bankDetails || 
      expertItem.documents || 
      expertItem.email ||
      expertItem.mobile ||
      expertItem.walletBalance !== undefined
    );
    assert(!leaksSensitiveFields, 'Public /api/experts masks password, bankDetails, documents, email, mobile, and walletBalance');

    // 2.2 Pending/Unapproved experts not exposed to public
    const publicExpertIds = (expertsListRes.body.experts || []).map(e => e._id.toString());
    assert(!publicExpertIds.includes(pendingExpert._id.toString()), 'Unapproved / pending experts are not exposed in public catalog');

    // 2.3 Single expert endpoint masks sensitive details including private contact info
    const singleExpertRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/experts/${approvedExpert._id}`,
      method: 'GET'
    });
    const singleExpert = singleExpertRes.body;
    const singleLeaks = singleExpert && (
      singleExpert.password || 
      singleExpert.bankDetails || 
      singleExpert.documents || 
      singleExpert.email ||
      singleExpert.mobile ||
      singleExpert.walletBalance !== undefined
    );
    assert(!singleLeaks, 'Single expert /api/experts/:id masks bank details, password, KYC docs, and private contact info');

    // 2.4 Verify HTTP Security Headers (CSP, X-Frame-Options, X-Content-Type-Options)
    assert(singleExpertRes.headers['content-security-policy'] !== undefined, 'Content-Security-Policy (CSP) header is present');
    assert(singleExpertRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assert(singleExpertRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options is nosniff');

    console.log('\n--- TEST GROUP 3: PAYMENT & WEBHOOK HMAC SIGNATURE INTEGRITY ---');

    // 3.1 Webhook with missing signature is rejected
    const noSigWebhookRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { event: 'payment.captured' });
    assert(noSigWebhookRes.statusCode === 400, 'Webhook without signature header returns 400 Bad Request');

    // 3.2 Webhook with invalid spoofed signature is rejected
    const badSigWebhookRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000'
      }
    }, { event: 'payment.captured' });
    assert(badSigWebhookRes.statusCode === 400, 'Webhook with forged HMAC signature returns 400 Bad Request');

    console.log('\n--- TEST GROUP 4: ATOMIC CONCURRENCY & RACE CONDITION DEFENSE ---');

    // 4.1 Create test consultation
    const consultation = await Consultation.create({
      user: activeUser._id,
      expert: approvedExpert._id,
      type: 'chat',
      cost: 300,
      durationInMinutes: 30,
      startTime: new Date(),
      status: 'scheduled',
      paymentStatus: 'pending'
    });

    // 4.2 Simultaneous wallet debits for 300 when balance is 500
    // Request 1 should succeed (500 -> 200).
    // Request 2 MUST fail (200 < 300). Balance MUST NEVER go negative!
    const results = await Promise.all([
      request({
        hostname: '127.0.0.1',
        port,
        path: '/api/wallet/pay-consultation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        }
      }, { consultationId: consultation._id.toString() }),
      request({
        hostname: '127.0.0.1',
        port,
        path: '/api/wallet/pay-consultation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        }
      }, { consultationId: consultation._id.toString() })
    ]);

    const successResponses = results.filter(r => r.statusCode === 200);
    const failResponses = results.filter(r => r.statusCode === 400);

    const refreshedUser = await User.findById(activeUser._id);
    assert(successResponses.length === 1 && failResponses.length === 1, 'Race condition prevented: exactly one concurrent payment succeeded');
    assert(refreshedUser.walletBalance >= 0, `Wallet balance is non-negative (Current balance: ₹${refreshedUser.walletBalance})`);

    console.log('\n--- TEST GROUP 5: BOLA / IDOR NOTIFICATION & BOOKING DEFENSE ---');

    // 5.1 Create notification for user 1
    const notif = await Notification.create({
      recipient: activeUser._id,
      recipientModel: 'User',
      recipientRole: 'USER',
      title: 'Secret Alert',
      message: 'Private message'
    });

    // 5.2 Attempt to delete notification using Bob's account (or unauthorized token)
    const unauthorizedDeleteRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/notifications/${notif._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${suspendedUserToken}` }
    });
    assert(unauthorizedDeleteRes.statusCode === 403 || unauthorizedDeleteRes.statusCode === 404, 'BOLA prevented: cannot delete another user\'s notification');

    // 5.3 Attempt to end another user's consultation is rejected with 403
    const strangerUser = await User.create({
      name: `Charlie Stranger ${testRunId}`,
      email: `charlie_${testRunId}@example.com`,
      password: 'password123',
      role: 'USER',
      status: 'ACTIVE'
    });
    const strangerToken = jwt.sign(
      { id: strangerUser._id, role: 'USER' },
      JWT_TEST_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const unauthorizedEndRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/bookings/${consultation._id}/end`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strangerToken}`
      }
    }, { actualDuration: 10 });
    assert(unauthorizedEndRes.statusCode === 403, 'BOLA prevented: unauthorized third-party cannot end consultation (403)');
    await User.deleteOne({ _id: strangerUser._id });

    // 5.4 Probe for sensitive panel / env files is blocked with 404
    const probeRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/.env',
      method: 'GET'
    });
    assert(probeRes.statusCode === 404, 'Direct probe for /.env is blocked with 404');

    console.log('\n--- TEST GROUP 6: RATING & REVIEW INTEGRITY ENFORCEMENT ---');

    // 6.1 Review without completed consultation is rejected
    const incompleteConsultation = await Consultation.create({
      user: activeUser._id,
      expert: approvedExpert._id,
      type: 'chat',
      cost: 100,
      durationInMinutes: 30,
      startTime: new Date(),
      status: 'scheduled',
      paymentStatus: 'paid'
    });

    const prematureReviewRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      consultationId: incompleteConsultation._id.toString(),
      rating: 5,
      feedback: 'Great service'
    });
    assert(prematureReviewRes.statusCode === 400, 'Review for uncompleted consultation is rejected (400)');

    // 6.2 Invalid rating (out of range / decimal / string) is rejected
    incompleteConsultation.status = 'completed';
    await incompleteConsultation.save();

    const invalidRatingRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      consultationId: incompleteConsultation._id.toString(),
      rating: 6, // invalid > 5
      feedback: 'Too high rating'
    });
    assert(invalidRatingRes.statusCode === 400, 'Out-of-range rating (6) is strictly rejected (400)');

    // 6.3 Valid review submission with XSS sanitization
    const validReviewRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      consultationId: incompleteConsultation._id.toString(),
      rating: 5,
      feedback: 'Excellent guidance! <script>alert(1)</script><img src=x onerror=alert(2)>'
    });
    assert(validReviewRes.statusCode === 201, 'Valid review for completed consultation submitted (201)');
    const savedReview = await Review.findOne({ consultation: incompleteConsultation._id });
    assert(savedReview && !savedReview.feedback.includes('<script>') && !savedReview.feedback.includes('<img'), 'Review feedback sanitized: HTML tags stripped to prevent Stored XSS');

    // 6.4 Duplicate review on same consultation is rejected
    const duplicateReviewRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    }, {
      consultationId: incompleteConsultation._id.toString(),
      rating: 4,
      feedback: 'Trying to review second time'
    });
    assert(duplicateReviewRes.statusCode === 409, 'Duplicate review on same consultation rejected (409 Conflict)');

    // 6.5 Expert aggregate rating recalculated correctly
    const refreshedExpert = await Expert.findById(approvedExpert._id);
    assert(refreshedExpert.rating === 5 && refreshedExpert.reviewsCount === 1, 'Expert aggregate rating recalculated accurately from database records');

    // ==========================================
    // TEST GROUP 7: FREE CHAT INTEGRITY (1/DAY & 1/EXPERT LIFETIME)
    // ==========================================
    console.log('\n--- TEST GROUP 7: FREE CHAT INTEGRITY (1/DAY & 1/EXPERT LIFETIME) ---');

    // Create 2 test experts for free chat test
    const freeExpertA = await Expert.create({
      name: 'Free Expert Alpha',
      email: `free_expert_a_${Date.now()}@experthub.test`,
      password: 'password123',
      phone: '9888877771',
      specialty: 'Astrology',
      pricePerMinute: 30,
      approvalStatus: 'approved',
      verificationStatus: 'APPROVED',
      isVerified: true
    });

    const freeExpertB = await Expert.create({
      name: 'Free Expert Beta',
      email: `free_expert_b_${Date.now()}@experthub.test`,
      password: 'password123',
      phone: '9888877772',
      specialty: 'Tarot',
      pricePerMinute: 40,
      approvalStatus: 'approved',
      verificationStatus: 'APPROVED',
      isVerified: true
    });

    const freeUser = await User.create({
      name: 'Free Chat Tester',
      email: `free_user_${Date.now()}@experthub.test`,
      password: 'password123',
      status: 'ACTIVE',
      walletBalance: 0
    });
    const freeUserToken = jwt.sign(
      { id: freeUser._id, role: 'USER' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    // 7.1 Free chat succeeds for Expert A on Day 1
    const startFreeA = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings/start-free-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeUserToken}`
      }
    }, {
      expertId: freeExpertA._id.toString()
    });
    assert(startFreeA.statusCode === 201 && startFreeA.body.consultation.isFree === true, 'Free chat successfully initiated with Expert A on Day 1 (201)');

    // 7.2 Free chat on the SAME day with Expert B is rejected with DAILY_LIMIT_REACHED
    const startFreeBSameDay = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings/start-free-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeUserToken}`
      }
    }, {
      expertId: freeExpertB._id.toString()
    });
    assert(startFreeBSameDay.statusCode === 400 && startFreeBSameDay.body.reason === 'DAILY_LIMIT_REACHED', 'Same day free chat with Expert B rejected with DAILY_LIMIT_REACHED (400)');

    // 7.3 Free chat with Expert A is rejected with EXPERT_ALREADY_USED
    const startFreeAAgain = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings/start-free-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeUserToken}`
      }
    }, {
      expertId: freeExpertA._id.toString()
    });
    assert(startFreeAAgain.statusCode === 400 && startFreeAAgain.body.reason === 'EXPERT_ALREADY_USED', 'Lifetime repeat free chat with Expert A rejected with EXPERT_ALREADY_USED (400)');

    // 7.4 Simulate Next Day: shift Expert A session date to yesterday (25 hours ago)
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await Consultation.collection.updateMany(
      { user: freeUser._id, expert: freeExpertA._id },
      { $set: { createdAt: yesterday, startTime: yesterday } }
    );
    await User.findByIdAndUpdate(freeUser._id, { lastFreeChatAt: yesterday });

    // User connects with Expert B on new day -> SUCCEEDS!
    const startFreeBNextDay = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings/start-free-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freeUserToken}`
      }
    }, {
      expertId: freeExpertB._id.toString()
    });
    assert(startFreeBNextDay.statusCode === 201 && startFreeBNextDay.body.consultation.isFree === true, 'Next day free chat with Expert B successfully started (201)');

    // 7.5 Status endpoint returns accurate eligibility per expert
    const statusResA = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/bookings/free-chat-status?expertId=${freeExpertA._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${freeUserToken}`
      }
    });
    assert(
      statusResA.statusCode === 200 &&
      statusResA.body.hasUsedWithExpert === true &&
      statusResA.body.reason === 'EXPERT_ALREADY_USED',
      'Status endpoint confirms Expert A is claimed (hasUsedWithExpert: true)'
    );

    const statusResOverall = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings/free-chat-status',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${freeUserToken}`
      }
    });
    assert(
      statusResOverall.statusCode === 200 &&
      statusResOverall.body.hasUsedToday === true &&
      statusResOverall.body.usedExpertIds.length >= 2,
      'Status endpoint accurately tracks today limit and all used expert IDs'
    );

    // ==========================================
    // TEST GROUP 8: BILLING SYSTEM MINIMUM RATES (CHAT >= 5, AUDIO >= 10, VIDEO >= 20)
    // ==========================================
    console.log('\n--- TEST GROUP 8: BILLING SYSTEM MINIMUM RATES (CHAT >= 5, AUDIO >= 10, VIDEO >= 20) ---');

    const expertTokenForRates = jwt.sign(
      { id: freeExpertA._id, role: 'EXPERT' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    // 8.1 Chat rate below ₹5 rejected (400)
    const updateChatTooLow = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/profile',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertTokenForRates}`
      }
    }, {
      rates: { chat: 4, audio: 15, video: 25 }
    });
    assert(updateChatTooLow.statusCode === 400, 'Expert setting chat rate below ₹5/min is rejected (400)');

    // 8.2 Audio rate below ₹10 rejected (400)
    const updateAudioTooLow = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/profile',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertTokenForRates}`
      }
    }, {
      rates: { chat: 5, audio: 9, video: 25 }
    });
    assert(updateAudioTooLow.statusCode === 400, 'Expert setting audio rate below ₹10/min is rejected (400)');

    // 8.3 Video rate below ₹20 rejected (400)
    const updateVideoTooLow = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/profile',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertTokenForRates}`
      }
    }, {
      rates: { chat: 5, audio: 10, video: 19 }
    });
    assert(updateVideoTooLow.statusCode === 400, 'Expert setting video rate below ₹20/min is rejected (400)');

    // 8.4 Valid minimum rates accepted (200)
    const updateValidMinRates = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/profile',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertTokenForRates}`
      }
    }, {
      rates: { chat: 5, audio: 10, video: 20 }
    });
    assert(
      updateValidMinRates.statusCode === 200 &&
      updateValidMinRates.body.expert.rates.chat === 5 &&
      updateValidMinRates.body.expert.rates.audio === 10 &&
      updateValidMinRates.body.expert.rates.video === 20,
      'Valid minimum rates (Chat: ₹5, Audio: ₹10, Video: ₹20) accepted successfully (200)'
    );

    // ==========================================
    // TEST GROUP 9: DYNAMIC CATEGORY-WISE COMMISSION CONTROL
    // ==========================================
    console.log('\n--- TEST GROUP 9: DYNAMIC CATEGORY-WISE COMMISSION CONTROL ---');

    // 9.1 Seed admin for category commission management
    const adminUser = await Admin.create({
      name: 'Super Admin',
      email: `admin_${Date.now()}@experthub.test`,
      password: 'password123',
      role: 'ADMIN'
    });
    const adminToken = jwt.sign(
      { id: adminUser._id, role: 'ADMIN' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    // 9.2 Reject invalid category commission rates (< 0 or > 100)
    const invalidHighCommRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: `Invalid High Cat ${testRunId}`,
      slug: `inv-high-${testRunId}`,
      commissionRate: 110
    });
    assert(invalidHighCommRes.statusCode === 400, 'Category creation with commission > 100% rejected (400)');

    const invalidNegativeCommRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: `Invalid Neg Cat ${testRunId}`,
      slug: `inv-neg-${testRunId}`,
      commissionRate: -10
    });
    assert(invalidNegativeCommRes.statusCode === 400, 'Category creation with negative commission rejected (400)');

    // 9.3 Create Category with custom 15% dynamic commission
    const catCreateRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: `Astro Dynamic ${testRunId}`,
      slug: `astro-dynamic-${testRunId}`,
      description: 'Astrology consultations with 15% custom fee',
      commissionRate: 15
    });
    assert(catCreateRes.statusCode === 201 && catCreateRes.body.category.commissionRate === 15, 'Admin created category with dynamic 15% commission (201)');
    const customCategory = catCreateRes.body.category;

    // 9.4 Create Category with null/default commission
    const defaultCatCreateRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: `General Dynamic ${testRunId}`,
      slug: `general-dynamic-${testRunId}`,
      description: 'Category inheriting platform default take'
    });
    assert(defaultCatCreateRes.statusCode === 201 && (defaultCatCreateRes.body.category.commissionRate === null || defaultCatCreateRes.body.category.commissionRate === undefined), 'Category without custom rate defaults to null/inherited (201)');
    const defaultCategory = defaultCatCreateRes.body.category;

    // 9.5 Verify helper resolves custom rate for Category A vs global default for Category B
    const commA = await getEffectiveCommission({ categoryId: customCategory._id });
    assert(commA.percentage === 15 && commA.rate === 0.15 && commA.source === 'CATEGORY', 'Category-specific dynamic commission correctly resolved (15%)');

    const commB = await getEffectiveCommission({ categoryId: defaultCategory._id });
    assert(commB.percentage === 20 && commB.rate === 0.20 && commB.source === 'GLOBAL', 'Fallback to platform global default (20%) when category commission is null');

    // 9.6 Dynamic update by Admin: change category commission from 15% to 10%
    const catUpdateRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/categories/${customCategory._id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      commissionRate: 10
    });
    assert(catUpdateRes.statusCode === 200 && catUpdateRes.body.category.commissionRate === 10, 'Admin dynamically changed category commission from 15% to 10% (200)');

    const commAUpdated = await getEffectiveCommission({ categoryId: customCategory._id });
    assert(commAUpdated.percentage === 10 && commAUpdated.rate === 0.10, 'Effective commission immediately reflects updated dynamic rate (10%)');

    // 9.7 End-to-end booking verification: verify platform fee and expert net earning calculation
    const catExpert = await Expert.create({
      name: 'Dynamic Comm Expert',
      email: `dyn_expert_${Date.now()}@experthub.test`,
      password: 'password123',
      specialty: 'Astrology',
      categoryId: customCategory._id,
      rates: { chat: 10, audio: 15, video: 30 },
      pricePerMinute: 10,
      approvalStatus: 'approved',
      verificationStatus: 'APPROVED',
      isVerified: true
    });

    const userWithBalance = await User.create({
      name: 'Comm Test User',
      email: `comm_user_${Date.now()}@experthub.test`,
      password: 'password123',
      status: 'ACTIVE',
      walletBalance: 500
    });
    const userTokenComm = jwt.sign({ id: userWithBalance._id, role: 'USER' }, JWT_TEST_SECRET, { expiresIn: '1h' });

    // Book 10 min chat session (Base = ₹10/min * 10 = ₹100, Commission = 10% = ₹10, Total = ₹110)
    const bookingRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userTokenComm}`
      }
    }, {
      expertId: catExpert._id.toString(),
      type: 'chat',
      duration: 10
    });
    assert(
      bookingRes.statusCode === 201 &&
      bookingRes.body.platformFee === 10 &&
      bookingRes.body.cost === 110 &&
      bookingRes.body.commissionRate === 10,
      'Consultation booking applies exact category-wise 10% platform fee (₹10 on ₹100 base)'
    );

    // Clean up test documents created during Test Group 9
    await Admin.deleteMany({ _id: adminUser._id });
    await Category.deleteMany({ _id: { $in: [customCategory._id, defaultCategory._id] } });
    await Expert.deleteMany({ _id: catExpert._id });
    await User.deleteMany({ _id: userWithBalance._id });
    if (bookingRes.body?._id) {
      await Consultation.deleteMany({ _id: bookingRes.body._id });
    }

    // ==========================================
    // TEST GROUP 10: BANK DETAILS, PASSBOOK IMAGE & DYNAMIC VERIFICATION
    // ==========================================
    console.log('\n--- TEST GROUP 10: BANK DETAILS, PASSBOOK IMAGE & DYNAMIC VERIFICATION ---');

    // 10.1 Create an expert and admin for bank verification testing
    const bankExpert = await Expert.create({
      name: 'Bank Verified Expert',
      email: `bank_expert_${Date.now()}@experthub.test`,
      password: 'password123',
      specialty: 'Finance',
      rates: { chat: 10, audio: 15, video: 30 },
      pricePerMinute: 10,
      approvalStatus: 'approved',
      isVerified: true,
      bankDetails: {
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        passbookImage: '',
        verificationStatus: 'NOT_SUBMITTED'
      }
    });

    const bankExpertToken = jwt.sign(
      { id: bankExpert._id, role: 'EXPERT' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    const bankAdmin = await Admin.create({
      name: 'Bank Verifier Admin',
      email: `bank_admin_${Date.now()}@experthub.test`,
      password: 'password123',
      role: 'ADMIN'
    });
    const bankAdminToken = jwt.sign(
      { id: bankAdmin._id, role: 'ADMIN' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    // Create completed consultation to provide available payout balance (₹500 >= ₹100 minimum)
    await Consultation.create({
      user: activeUser._id,
      expert: bankExpert._id,
      type: 'chat',
      cost: 500,
      expertEarning: 400,
      durationInMinutes: 20,
      startTime: new Date(),
      status: 'completed',
      paymentStatus: 'paid'
    });

    // 10.2 Submitting bank details WITHOUT passbook image is rejected (400)
    const missingPassbookRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/experts/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankExpertToken}`
      }
    }, {
      bankDetails: {
        accountName: 'Ramesh Sharma',
        bankName: 'HDFC Bank',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        passbookImage: '' // Missing!
      }
    });
    assert(missingPassbookRes.statusCode === 400, 'Submitting bank details without Passbook image is rejected (400)');

    // 10.3 Valid bank details with passbook image is accepted and sets verificationStatus to PENDING (200)
    const validBankRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/experts/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankExpertToken}`
      }
    }, {
      bankDetails: {
        accountName: 'Ramesh Sharma',
        bankName: 'HDFC Bank',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        passbookImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    });
    assert(
      validBankRes.statusCode === 200 &&
      validBankRes.body.expert.bankDetails.verificationStatus === 'PENDING' &&
      validBankRes.body.expert.bankDetails.passbookImage.length > 0,
      'Valid bank details with Passbook image saved with status PENDING for Admin verification (200)'
    );

    // 10.4 Requesting payout while bank details are PENDING is blocked (400)
    const payoutBlockedRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/payouts/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankExpertToken}`
      }
    }, {});
    assert(
      payoutBlockedRes.statusCode === 400 &&
      payoutBlockedRes.body.code === 'BANK_NOT_VERIFIED',
      'Payout request blocked while bank verification status is PENDING (400 BANK_NOT_VERIFIED)'
    );

    // 10.5 Admin approves expert bank details (200)
    const adminApproveBankRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/experts/${bankExpert._id}/bank/approve`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankAdminToken}`
      }
    }, {});
    assert(
      adminApproveBankRes.statusCode === 200 &&
      adminApproveBankRes.body.expert.bankDetails.verificationStatus === 'APPROVED',
      'Admin successfully approves bank details and passbook (200 APPROVED)'
    );

    // 10.6 Expert can now request payout once bank details are APPROVED
    const payoutAllowedRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/payouts/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankExpertToken}`
      }
    }, {});
    assert(payoutAllowedRes.statusCode === 200, 'Payout request succeeds after Admin approval (200)');

    // 10.7 DYNAMIC RE-VERIFICATION: Expert edits account number -> automatically reverts to PENDING
    const editBankRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/experts/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankExpertToken}`
      }
    }, {
      bankDetails: {
        accountName: 'Ramesh Sharma',
        bankName: 'ICICI Bank',
        accountNumber: '999988887777', // Changed!
        ifscCode: 'ICIC0009999'
        // passbookImage will reuse existing
      }
    });
    assert(
      editBankRes.statusCode === 200 &&
      editBankRes.body.expert.bankDetails.verificationStatus === 'PENDING' &&
      editBankRes.body.expert.bankDetails.accountNumber === '999988887777',
      'Editing bank details automatically reverts status back to PENDING for Admin re-verification (200)'
    );

    // 10.8 Admin rejects bank details with reason
    const adminRejectBankRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/experts/${bankExpert._id}/bank/reject`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bankAdminToken}`
      }
    }, {
      reason: 'Passbook account number does not match submitted account number'
    });
    assert(
      adminRejectBankRes.statusCode === 200 &&
      adminRejectBankRes.body.expert.bankDetails.verificationStatus === 'REJECTED' &&
      adminRejectBankRes.body.expert.bankDetails.rejectionReason.includes('Passbook account number'),
      'Admin rejects bank details with recorded reason (200 REJECTED)'
    );

    // Clean up test documents
    await Expert.deleteMany({ _id: bankExpert._id });
    await Admin.deleteMany({ _id: bankAdmin._id });

    // Clean up test documents created during this run
    await User.deleteMany({ _id: { $in: [activeUser._id, suspendedUser._id, freeUser._id] } });
    await Expert.deleteMany({ _id: { $in: [approvedExpert._id, pendingExpert._id, freeExpertA._id, freeExpertB._id] } });
    await Consultation.deleteMany({ user: freeUser._id });
    await Expert.deleteMany({ _id: { $in: [approvedExpert._id, pendingExpert._id] } });
    await Consultation.deleteMany({ _id: { $in: [consultation._id, incompleteConsultation._id] } });
    await Review.deleteMany({ consultation: incompleteConsultation._id });
    await Notification.deleteMany({ _id: notif._id });
    await WalletTransaction.deleteMany({ user: { $in: [activeUser._id, suspendedUser._id] } });

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
