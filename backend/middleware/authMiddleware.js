const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ message: 'Authentication configuration error' });
      }

      // Explicitly pin algorithm to HS256 to prevent algorithm confusion attacks
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

      // Determine user type and attach to request
      let user = await User.findById(decoded.id).select('-password');
      let userType = 'USER';

      if (!user) {
        user = await Expert.findById(decoded.id).select('-password');
        userType = 'EXPERT';
      }
      if (!user) {
        user = await Admin.findById(decoded.id).select('-password');
        userType = 'ADMIN';
      }

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, account not found' });
      }

      // Enforce account status check: suspended or blocked users/experts cannot access protected routes
      if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
        return res.status(403).json({
          message: `Account is ${user.status.toLowerCase()}. Access denied. Please contact support.`,
          code: 'ACCOUNT_SUSPENDED',
          status: user.status
        });
      }

      req.user = user;
      req.userType = userType;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please log in again', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Not authorized, invalid token', code: 'INVALID_TOKEN' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
