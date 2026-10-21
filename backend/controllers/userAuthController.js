const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Expert = require('../models/Expert');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/user/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      mobile,
      role: 'USER',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        hasUsedFreeChat: user.hasUsedFreeChat || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/user/login
const loginUser = async (req, res) => {
  try {
    const { email, password, reactivate } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Check if user account was deactivated/suspended
      if (user.status === 'SUSPENDED') {
        if (reactivate) {
          user.status = 'ACTIVE';
          await user.save();
        } else {
          return res.status(403).json({ 
            message: 'Your account is currently deactivated. Would you like to reactivate it?',
            isDeactivated: true,
            status: 'SUSPENDED'
          });
        }
      } else if (user.status !== 'ACTIVE') {
        return res.status(403).json({ 
          message: `Account is ${user.status.toLowerCase()}`,
          isDeactivated: false,
          status: user.status
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        hasUsedFreeChat: user.hasUsedFreeChat || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reactivate user account
// @route   POST /api/auth/user/reactivate
const reactivateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'BLOCKED') {
        return res.status(403).json({ 
          message: 'Your account has been blocked by administration. Please contact support.',
          isDeactivated: false,
          status: 'BLOCKED'
        });
      }

      user.status = 'ACTIVE';
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        hasUsedFreeChat: user.hasUsedFreeChat || false,
        token: generateToken(user._id),
        message: 'Account reactivated successfully!'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password (User or Expert)
// @route   POST /api/auth/forgotpassword
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check User first
    let account = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    let role = 'USER';

    // 2. If not found in User, check Expert
    if (!account) {
      account = await Expert.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
      role = 'EXPERT';
    }

    if (!account) {
      return res.status(404).json({ message: 'No registered account found with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    account.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire (15 minutes)
    account.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await account.save({ validateBeforeSave: false });

    // Determine client origin for the reset link
    const origin = req.get('origin') || req.get('referer');
    let clientUrl = origin ? origin.replace(/\/$/, '') : '';
    try {
      if (clientUrl) {
        const u = new URL(clientUrl);
        clientUrl = `${u.protocol}//${u.host}`;
      }
    } catch (e) {}

    const frontendBase = clientUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;

    const message = `Hello ${account.name || 'there'},\n\nYou (or someone else) requested a password reset for your ${role === 'EXPERT' ? 'ExpertHub Consultant' : 'ExpertHub User'} account.\n\nPlease reset your password by opening the link below (valid for 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Expert<span style="color: #f59e0b;">Hub</span></h2>
        <h3 style="color: #1e293b; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello <strong>${account.name || ''}</strong>,<br/>
          We received a request to reset the password for your <strong>${role === 'EXPERT' ? 'Expert' : 'User'}</strong> account.
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
          Or copy and paste this link in your browser:<br/>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">
          This link will expire in 15 minutes. If you did not make this request, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: account.email,
        subject: 'Reset Your ExpertHub Password',
        message,
        htmlMessage
      });

      res.status(200).json({ 
        success: true, 
        message: 'Password reset link sent to your email',
        role
      });
    } catch (err) {
      account.resetPasswordToken = undefined;
      account.resetPasswordExpire = undefined;
      await account.save({ validateBeforeSave: false });

      console.error('Error sending reset email:', err.message || err);
      const isAuthError = err.code === 'EAUTH' || (err.response && err.response.includes('535'));
      const errorMsg = isAuthError
        ? 'Gmail authentication failed (BadCredentials): Google ne App Password accept nahi kiya. Kripya naya 16-digit App Password generate karke backend/.env me dalein.'
        : 'Email could not be sent. Please try again later.';
      return res.status(500).json({ message: errorMsg, code: err.code });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password with token (User or Expert)
// @route   POST /api/auth/resetpassword/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Check User
    let account = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    let role = 'USER';

    // 2. If not found in User, check Expert
    if (!account) {
      account = await Expert.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
      role = 'EXPERT';
    }

    if (!account) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    // Set new password
    account.password = password;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpire = undefined;

    // Trigger pre('save') hashing hook
    await account.save();

    res.status(200).json({
      success: true,
      role,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  reactivateUser,
  forgotPassword,
  resetPassword,
};
