const jwt = require('jsonwebtoken');
const Expert = require('../models/Expert');

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

    const expert = await Expert.create({
      name,
      email,
      password,
      specialty,
      pricePerMinute: pricePerMinute || 0, // Should be populated later or required based on flow
      mobile,
      role: 'EXPERT',
      verificationStatus: 'PENDING',
    });

    if (expert) {
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
// @route   POST /api/auth/expert/login
const loginExpert = async (req, res) => {
  try {
    const { email, password } = req.body;

    const expert = await Expert.findOne({ email });

    if (expert && (await expert.matchPassword(password))) {
      if (expert.status !== 'ACTIVE') {
        return res.status(403).json({ message: `Account is ${expert.status.toLowerCase()}` });
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

module.exports = {
  registerExpert,
  loginExpert,
};
