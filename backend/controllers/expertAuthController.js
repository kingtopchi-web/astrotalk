const jwt = require('jsonwebtoken');
const Expert = require('../models/Expert');
const Setting = require('../models/Setting');
const { sendNotification } = require('../utils/notificationDispatcher');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new expert
// @route   POST /api/auth/expert/register
const registerExpert = async (req, res) => {
  try {
    const { name, email, password, specialty, pricePerMinute, mobile } = req.body;

    const expertExists = await Expert.findOne({ email });
    if (expertExists) {
      return res.status(400).json({ message: 'Expert already exists' });
    }

    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const isAutoApprove = Boolean(settings && settings.autoApproveExperts);
    const initialStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    const expert = await Expert.create({
      name,
      email,
      password,
      specialty,
      pricePerMinute: pricePerMinute || 0, // Should be populated later or required based on flow
      mobile,
      role: 'EXPERT',
      verificationStatus: initialStatus,
    });

    if (expert) {
      const io = req.app.get('io');
      sendNotification({
        recipientRole: 'ADMIN',
        recipientModel: 'Admin',
        title: isAutoApprove ? 'New Expert Auto-Approved' : 'New Expert Registration',
        message: isAutoApprove 
          ? `${expert.name} has registered and was auto-approved (${expert.specialty || 'General'}).` 
          : `${expert.name} has submitted an application for approval (${expert.specialty || 'General'}).`,
        type: 'expert_registration',
        link: '/admin/experts',
        actionText: 'Review application',
        badge: isAutoApprove ? 'Approved' : 'New'
      }, io).catch(e => console.error('Expert reg notification error:', e));

      res.status(201).json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid expert data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth expert & get token
// @desc    Auth expert & get token
// @route   POST /api/auth/expert/login
const loginExpert = async (req, res) => {
  try {
    const { email, password, reactivate } = req.body;

    const expert = await Expert.findOne({ email });

    if (expert && (await expert.matchPassword(password))) {
      if (expert.status === 'SUSPENDED') {
        if (reactivate) {
          expert.status = 'ACTIVE';
          await expert.save();
        } else {
          return res.status(403).json({ 
            message: 'Your account is currently deactivated. Would you like to reactivate it?',
            isDeactivated: true,
            status: 'SUSPENDED'
          });
        }
      } else if (expert.status !== 'ACTIVE') {
        return res.status(403).json({ 
          message: `Account is ${expert.status.toLowerCase()}`,
          isDeactivated: false,
          status: expert.status
        });
      }

      // We still allow login if PENDING, but frontend should redirect to onboarding or show pending screen

      res.json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reactivate expert account
// @route   POST /api/auth/expert/reactivate
const reactivateExpert = async (req, res) => {
  try {
    const { email, password } = req.body;

    const expert = await Expert.findOne({ email });

    if (expert && (await expert.matchPassword(password))) {
      if (expert.status === 'BLOCKED') {
        return res.status(403).json({ 
          message: 'Your account has been blocked by administration. Please contact support.',
          isDeactivated: false,
          status: 'BLOCKED'
        });
      }

      expert.status = 'ACTIVE';
      await expert.save();

      res.json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
        message: 'Account reactivated successfully!'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerExpert,
  loginExpert,
  reactivateExpert,
};
