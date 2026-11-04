const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Admin = require('../models/Admin');
const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const Setting = require('../models/Setting');
const User = require('../models/User');

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

async function runTests() {
  console.log('\n======================================================');
  console.log('   ADMIN MANAGEMENT & DYNAMIC PAYOUT LIMIT SUITE       ');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/admin', require('../routes/adminRoutes'));
  app.use('/api/expert', require('../routes/expertProfileRoutes'));

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  const testId = Date.now();
  let rootAdmin, expertUser, clientUser;

  try {
    // 1. Create Root Admin
    rootAdmin = await Admin.create({
      name: 'Root Administrator',
      email: `root_admin_${testId}@gmail.com`,
      password: 'RootPassword@123',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    const rootAdminToken = jwt.sign(
      { id: rootAdmin._id, role: 'ADMIN' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    console.log('--- TEST GROUP 1: DYNAMIC MINIMUM PAYOUT AMOUNT CONTROL ---');

    // 1.1 Admin sets dynamic minimum payout to ₹500 via settings
    const setMinPayoutRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      minPayoutAmount: 500
    });
    assert.strictEqual(setMinPayoutRes.statusCode, 200, 'Admin can update settings (200)');
    assert.strictEqual(setMinPayoutRes.body.minPayoutAmount, 500, 'minPayoutAmount saved as ₹500');
    console.log('  [PASS] Admin dynamically set minimum payout limit to ₹500');

    // Create client user and verified expert with bank details
    clientUser = await User.create({
      name: 'Client User',
      email: `client_${testId}@gmail.com`,
      password: 'password123',
      status: 'ACTIVE'
    });

    expertUser = await Expert.create({
      name: 'Tarot Reader',
      email: `expert_payout_${testId}@gmail.com`,
      password: 'password123',
      specialty: 'Tarot',
      approvalStatus: 'approved',
      verificationStatus: 'APPROVED',
      isVerified: true,
      bankDetails: {
        accountName: 'Tarot Reader',
        accountNumber: '998877665544',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        passbookImage: 'data:image/png;base64,abc',
        verificationStatus: 'APPROVED'
      }
    });
    const expertToken = jwt.sign(
      { id: expertUser._id, role: 'EXPERT' },
      JWT_TEST_SECRET,
      { expiresIn: '1h' }
    );

    // Give expert earnings of ₹300 (which is < ₹500 minimum payout limit)
    await Consultation.create({
      user: clientUser._id,
      expert: expertUser._id,
      type: 'chat',
      cost: 300,
      expertEarning: 300,
      durationInMinutes: 10,
      startTime: new Date(),
      status: 'completed',
      paymentStatus: 'paid'
    });

    // 1.2 Expert requests payout with available balance ₹300 < ₹500 -> Rejected!
    const payoutBelowMinRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/payouts/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertToken}`
      }
    }, {});
    assert.strictEqual(payoutBelowMinRes.statusCode, 400, 'Payout below dynamic minimum is rejected (400)');
    assert(payoutBelowMinRes.body.message.includes('₹500'), 'Error message states required ₹500 minimum');
    console.log('  [PASS] Payout of ₹300 rejected when Admin dynamic minimum is ₹500');

    // 1.3 Admin dynamically lowers payout limit to ₹250
    await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      minPayoutAmount: 250
    });

    // 1.4 Expert requests payout again: ₹300 >= ₹250 -> Allowed!
    const payoutAllowedRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/expert/payouts/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expertToken}`
      }
    }, {});
    assert.strictEqual(payoutAllowedRes.statusCode, 200, 'Payout allowed once balance satisfies dynamic limit (200)');
    console.log('  [PASS] Payout of ₹300 succeeded after Admin dynamically set limit to ₹250');

    console.log('\n--- TEST GROUP 2: ADMINISTRATORS MANAGEMENT & LOGIN ---');

    // 2.1 Fetch administrators list
    const listAdminsRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/administrators',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${rootAdminToken}`
      }
    });
    assert.strictEqual(listAdminsRes.statusCode, 200, 'List administrators returns 200');
    assert(Array.isArray(listAdminsRes.body), 'Administrators is an array');
    console.log(`  [PASS] Successfully fetched administrators list (Found ${listAdminsRes.body.length})`);

    // 2.2 Create new Administrator with custom Gmail and password
    const newAdminEmail = `subadmin_${testId}@gmail.com`;
    const newAdminPassword = 'SubAdminPass@2026';
    const createAdminRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/administrators',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      name: 'Sub Admin One',
      email: newAdminEmail,
      password: newAdminPassword,
      mobile: '9876543210',
      role: 'ADMIN'
    });
    assert.strictEqual(createAdminRes.statusCode, 201, 'Create administrator returns 201');
    assert.strictEqual(createAdminRes.body.admin.email, newAdminEmail, 'Created admin email matches');
    assert.strictEqual(createAdminRes.body.admin.status, 'ACTIVE', 'Created admin status is ACTIVE');
    console.log('  [PASS] Admin successfully added new administrator with Gmail and password');

    // 2.3 Duplicate email is rejected
    const duplicateAdminRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/admin/administrators',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      name: 'Duplicate Admin',
      email: newAdminEmail,
      password: 'SomeOtherPassword123'
    });
    assert.strictEqual(duplicateAdminRes.statusCode, 400, 'Duplicate admin email rejected (400)');
    console.log('  [PASS] Duplicate administrator email correctly rejected (400)');

    // 2.4 New Administrator logs into Admin Panel with their credentials
    const subAdminLoginRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: newAdminEmail,
      password: newAdminPassword
    });
    assert.strictEqual(subAdminLoginRes.statusCode, 200, 'New administrator logged in successfully (200)');
    assert(subAdminLoginRes.body.token, 'Received JWT auth token for admin panel');
    assert.strictEqual(subAdminLoginRes.body.role, 'ADMIN', 'Role is ADMIN');
    console.log('  [PASS] Newly created administrator successfully signed into admin panel');

    const subAdminToken = subAdminLoginRes.body.token;

    // 2.5 Admin suspends sub-admin account
    const suspendRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/administrators/${createAdminRes.body.admin._id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      status: 'SUSPENDED'
    });
    assert.strictEqual(suspendRes.statusCode, 200, 'Status updated to SUSPENDED (200)');

    // 2.6 Suspended administrator cannot log in
    const suspendedLoginRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: newAdminEmail,
      password: newAdminPassword
    });
    assert.strictEqual(suspendedLoginRes.statusCode, 403, 'Suspended administrator login blocked (403)');
    console.log('  [PASS] Suspended administrator is blocked from signing in (403)');

    // 2.7 Reactivate sub-admin and update password
    await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/administrators/${createAdminRes.body.admin._id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      status: 'ACTIVE'
    });

    const updatedPassword = 'NewSecretPassword@999';
    const changePassRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/administrators/${createAdminRes.body.admin._id}/password`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rootAdminToken}`
      }
    }, {
      newPassword: updatedPassword
    });
    assert.strictEqual(changePassRes.statusCode, 200, 'Password updated (200)');

    // 2.8 Login with new password succeeds
    const newPassLoginRes = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: newAdminEmail,
      password: updatedPassword
    });
    assert.strictEqual(newPassLoginRes.statusCode, 200, 'Login with updated password succeeds (200)');
    console.log('  [PASS] Administrator password change verified via successful login');

    // 2.9 Self-deletion prevention
    const selfDeleteRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/administrators/${rootAdmin._id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${rootAdminToken}`
      }
    });
    assert.strictEqual(selfDeleteRes.statusCode, 400, 'Admin cannot delete themselves (400)');
    console.log('  [PASS] Self-deletion prevention enforced');

    // 2.10 Delete sub-admin account
    const deleteSubAdminRes = await request({
      hostname: '127.0.0.1',
      port,
      path: `/api/admin/administrators/${createAdminRes.body.admin._id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${rootAdminToken}`
      }
    });
    assert.strictEqual(deleteSubAdminRes.statusCode, 200, 'Delete administrator returns 200');
    console.log('  [PASS] Administrator account deleted successfully');

    console.log('\n======================================================');
    console.log('  ALL ADMIN MANAGEMENT & PAYOUT TESTS PASSED!         ');
    console.log('======================================================\n');
  } finally {
    await Admin.deleteMany({ email: new RegExp(`.*_${testId}@gmail.com`) });
    await User.deleteMany({ email: new RegExp(`.*_${testId}@gmail.com`) });
    await Expert.deleteMany({ email: new RegExp(`.*_${testId}@gmail.com`) });
    await Consultation.deleteMany({ expert: { $in: [expertUser?._id] } });
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
