const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'USER' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/user/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    // Password is optional (fallback to random secure token if omitted)
    const userPassword = (password && typeof password === 'string' && password.length >= 6)
      ? password
      : crypto.randomBytes(16).toString('hex');

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: userPassword,
      mobile: typeof mobile === 'string' ? mobile.trim() : undefined,
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
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/user/login
const loginUser = async (req, res) => {
  try {
    const { email, password, reactivate } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    const expert = await Expert.findOne({ email: normalizedEmail });

    // If User record does not exist yet, but Expert exists with matching password
    if (!user && expert) {
      if (await expert.matchPassword(password)) {
        user = await User.create({
          name: expert.name,
          email: normalizedEmail,
          password: password, // Mongoose User pre-save will hash this properly
          mobile: expert.mobile,
          profileImage: expert.profileImage || '',
          role: 'USER',
          status: expert.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
        });
      }
    } else if (user && expert) {
      // If user exists, but password was updated/set on expert
      const userMatches = await user.matchPassword(password);
      if (!userMatches && (await expert.matchPassword(password))) {
        user.password = password;
        await user.save();
      }
    }

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
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reactivate user account
// @route   POST /api/auth/user/reactivate
const reactivateUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    const expert = await Expert.findOne({ email: normalizedEmail });

    if (user && expert && !(await user.matchPassword(password)) && (await expert.matchPassword(password))) {
      user.password = password;
      await user.save();
    }

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

    // Check both User and Expert collections
    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    const expert = await Expert.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });

    if (!user && !expert) {
      return res.status(404).json({ message: 'No registered account found with that email address' });
    }

    const account = user || expert;
    const role = (user && expert) ? 'USER & EXPERT' : (expert ? 'EXPERT' : 'USER');

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expireTime = Date.now() + 15 * 60 * 1000; // 15 minutes

    if (user) {
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = expireTime;
      await user.save({ validateBeforeSave: false });
    }
    if (expert) {
      expert.resetPasswordToken = hashedToken;
      expert.resetPasswordExpire = expireTime;
      await expert.save({ validateBeforeSave: false });
    }

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

    const message = `Hello ${account.name || 'there'},\n\nYou (or someone else) requested a password reset for your ExpertHub account.\n\nPlease reset your password by opening the link below (valid for 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Expert<span style="color: #f59e0b;">Hub</span></h2>
        <h3 style="color: #1e293b; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello <strong>${account.name || ''}</strong>,<br/>
          We received a request to reset the password for your <strong>${role}</strong> account.
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
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
      if (expert) {
        expert.resetPasswordToken = undefined;
        expert.resetPasswordExpire = undefined;
        await expert.save({ validateBeforeSave: false });
      }

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

    // Find User and Expert matching the reset token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    const expert = await Expert.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user && !expert) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    const targetEmail = (user?.email || expert?.email || '').toLowerCase().trim();

    if (user) {
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }
    if (expert) {
      expert.password = password;
      expert.resetPasswordToken = undefined;
      expert.resetPasswordExpire = undefined;
      await expert.save();
    }

    // Keep password in sync across both accounts if same email exists in both
    if (targetEmail) {
      if (user && !expert) {
        const otherExpert = await Expert.findOne({ email: targetEmail });
        if (otherExpert) {
          otherExpert.password = password;
          otherExpert.resetPasswordToken = undefined;
          otherExpert.resetPasswordExpire = undefined;
          await otherExpert.save();
        }
      } else if (expert && !user) {
        const otherUser = await User.findOne({ email: targetEmail });
        if (otherUser) {
          otherUser.password = password;
          otherUser.resetPasswordToken = undefined;
          otherUser.resetPasswordExpire = undefined;
          await otherUser.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Send OTP to email for Login or Registration
// @route   POST /api/auth/send-otp
const sendAuthOtp = async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPurpose = String(purpose).toLowerCase();

    // Check if user exists (and support same email for Expert & User)
    let userExists = await User.findOne({ email: normalizedEmail });
    const expertExists = await Expert.findOne({ email: normalizedEmail });

    if (cleanPurpose === 'login') {
      if (!userExists && expertExists) {
        // Auto-provision a matching User account so the expert can log in as a User too
        userExists = await User.create({
          name: expertExists.name,
          email: normalizedEmail,
          mobile: expertExists.mobile,
          profileImage: expertExists.profileImage || '',
          role: 'USER',
          authProvider: 'otp',
          status: expertExists.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
        });
      }

      if (!userExists) {
        return res.status(404).json({ 
          message: 'No account found with this email. Please register first.',
          notRegistered: true 
        });
      }
      if (userExists.status === 'BLOCKED') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }
    } else if (cleanPurpose === 'register') {
      if (userExists || expertExists) {
        return res.status(400).json({ 
          message: 'An account with this email already exists. Please login instead.',
          alreadyRegistered: true 
        });
      }
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save or update OTP in database
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: cleanPurpose.toUpperCase() },
      { otp, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`🔐 [AUTH OTP] Generated OTP for ${normalizedEmail} [${cleanPurpose.toUpperCase()}]: ${otp}`);

    const isRegister = cleanPurpose === 'register';
    const emailSubject = isRegister
      ? 'Your Verification Code to Register - ExpertHub'
      : 'Your Login Verification Code - ExpertHub';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
            Expert<span style="color: #2563eb;">Hub</span>
          </h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 500;">Real Guidance & Consultations</p>
        </div>

        <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #475569; font-size: 15px; margin: 0 0 16px 0; font-weight: 500;">
            ${isRegister ? 'Use this verification code to complete your registration:' : 'Use this verification code to log in to your account:'}
          </p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e293b; background: #ffffff; padding: 14px 28px; border-radius: 10px; display: inline-block; border: 2px dashed #94a3b8; font-family: monospace;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">
            ⏱️ Valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
          If you did not request this OTP, please ignore this email or reach out to support.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: normalizedEmail,
        subject: emailSubject,
        message: `Your ExpertHub verification code is: ${otp} (valid for 10 minutes)`,
        htmlMessage: emailHtml,
      });
    } catch (emailErr) {
      console.error('⚠️ [sendEmail] Failed to deliver email via transporter:', emailErr.message);
      console.log(`🔑 [CONSOLE FALLBACK OTP] ${normalizedEmail} -> OTP: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error in sendAuthOtp:', error);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// @desc    Verify OTP & Log in User
// @route   POST /api/auth/verify-otp-login
const verifyOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide both email and OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'LOGIN',
      otp: cleanOtp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please enter the correct OTP or request a new one.' });
    }

    // Delete verified OTP
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'LOGIN' });

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const expert = await Expert.findOne({ email: normalizedEmail });
      if (expert) {
        user = await User.create({
          name: expert.name,
          email: normalizedEmail,
          mobile: expert.mobile,
          profileImage: expert.profileImage || '',
          role: 'USER',
          authProvider: 'otp',
          status: expert.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
        });
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found. Please register first.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
    }

    if (user.status === 'SUSPENDED') {
      user.status = 'ACTIVE';
      await user.save();
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      hasUsedFreeChat: user.hasUsedFreeChat || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error in verifyOtpLogin:', error);
    return res.status(500).json({ message: 'Login verification failed. Please try again.' });
  }
};

// @desc    Verify OTP & Register User (NO PASSWORD REQUIRED)
// @route   POST /api/auth/verify-otp-register
const verifyOtpRegister = async (req, res) => {
  try {
    const { name, email, otp, mobile } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'REGISTER',
      otp: cleanOtp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please enter the correct OTP or request a new one.' });
    }

    // Delete verified OTP
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'REGISTER' });

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    // Create user without requiring a password
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      mobile: typeof mobile === 'string' ? mobile.trim() : undefined,
      role: 'USER',
      authProvider: 'otp',
      status: 'ACTIVE',
    });

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      profileImage: newUser.profileImage,
      hasUsedFreeChat: false,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    console.error('Error in verifyOtpRegister:', error);
    return res.status(500).json({ message: 'Registration verification failed. Please try again.' });
  }
};

// @desc    Social Login (Google / Facebook)
// @route   POST /api/auth/social-login
const socialLogin = async (req, res) => {
  try {
    const { provider, email, name, avatar, providerId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required for social authentication' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanProvider = (provider === 'facebook' ? 'facebook' : 'google');

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const expert = await Expert.findOne({ email: normalizedEmail });
      user = await User.create({
        name: name ? name.trim() : (expert?.name || (cleanProvider === 'google' ? 'Google User' : 'Facebook User')),
        email: normalizedEmail,
        profileImage: avatar || expert?.profileImage || '',
        authProvider: cleanProvider,
        socialId: providerId || '',
        mobile: expert?.mobile,
        role: 'USER',
        status: expert?.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
      });
    } else {
      if (user.status === 'BLOCKED') {
        return res.status(403).json({ message: 'This account is blocked. Please contact support.' });
      }
      if (user.status === 'SUSPENDED') {
        user.status = 'ACTIVE';
      }
      if (!user.profileImage && avatar) {
        user.profileImage = avatar;
      }
      await user.save();
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      hasUsedFreeChat: user.hasUsedFreeChat || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error in socialLogin:', error);
    return res.status(500).json({ message: 'Social authentication failed. Please try again.' });
  }
};

// @desc    Verify Google ID Token via Google's official oauth2 API
// @route   POST /api/auth/google-verify
const verifyGoogleToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    // Securely verify token directly with Google OAuth servers
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const payload = await googleRes.json();

    if (!googleRes.ok || payload.error || (payload.email_verified !== 'true' && payload.email_verified !== true)) {
      return res.status(401).json({ 
        message: 'Google authentication failed: Email is not verified by Google or token is invalid' 
      });
    }

    const normalizedEmail = String(payload.email).toLowerCase().trim();
    const name = payload.name || payload.given_name || 'Google User';
    const avatar = payload.picture || '';
    const googleSub = payload.sub;

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const expert = await Expert.findOne({ email: normalizedEmail });
      user = await User.create({
        name: name || expert?.name || 'Google User',
        email: normalizedEmail,
        profileImage: avatar || expert?.profileImage || '',
        authProvider: 'google',
        socialId: googleSub,
        mobile: expert?.mobile,
        role: 'USER',
        status: expert?.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
      });
    } else {
      if (user.status === 'BLOCKED') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }
      if (user.status === 'SUSPENDED') {
        user.status = 'ACTIVE';
      }
      if (!user.profileImage && avatar) {
        user.profileImage = avatar;
      }
      await user.save();
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      hasUsedFreeChat: user.hasUsedFreeChat || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    return res.status(500).json({ message: 'Google verification failed. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  reactivateUser,
  forgotPassword,
  resetPassword,
  sendAuthOtp,
  verifyOtpLogin,
  verifyOtpRegister,
  socialLogin,
  verifyGoogleToken,
};
