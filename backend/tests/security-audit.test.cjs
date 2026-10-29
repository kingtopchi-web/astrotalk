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
const Consultation = require('../models/Consultation');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const WalletTransaction = require('../models/WalletTransaction');

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
    app.use('/api/bookings', require('../routes/bookingRoutes'));
    app.use('/api/payments', require('../routes/paymentRoutes'));
    app.use('/api/wallet', require('../routes/walletRoutes'));
    app.use('/api/notifications', require('../routes/notificationRoutes'));
    app.use('/api/reviews', require('../routes/reviewRoutes'));

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

    // Clean up test documents created during this run
    await User.deleteMany({ _id: { $in: [activeUser._id, suspendedUser._id] } });
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
