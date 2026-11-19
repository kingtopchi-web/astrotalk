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

      // Auto-lift expired temporary suspension for Expert
      if (userType === 'EXPERT' || user.role === 'EXPERT') {
        if (
          user.status === 'SUSPENDED' &&
          user.suspensionDetails?.type === 'TEMPORARY' &&
          user.suspensionDetails?.suspendedUntil &&
          new Date(user.suspensionDetails.suspendedUntil) <= new Date()
        ) {
          user.status = 'ACTIVE';
          if (user.suspensionDetails) {
            user.suspensionDetails.isSuspended = false;
            user.suspensionDetails.type = 'NONE';
          }
          await user.save();
        }
      }

      // Enforce account status check:
      if (user.status === 'BLOCKED') {
        return res.status(403).json({
          message: 'Account is blocked by administration. Access denied. Please contact support.',
          code: 'ACCOUNT_BLOCKED',
          status: 'BLOCKED'
        });
      }

      if (user.status === 'SUSPENDED') {
        const path = req.originalUrl || req.baseUrl || req.path || '';
        const isExpertReadOnly = (userType === 'EXPERT' || user.role === 'EXPERT') && (
          (req.method === 'GET' && (
            path.includes('/api/expert/profile') ||
            path.includes('/api/expert/dashboard') ||
            path.includes('/api/expert/earnings') ||
            path.includes('/api/notifications') ||
            path.includes('/api/push-notifications')
          ))
        );

        if (!isExpertReadOnly) {
          return res.status(403).json({
            message: `Account is suspended by Administrator. Reason: ${user.suspensionDetails?.reason || 'Disciplinary Action'}.`,
            code: 'ACCOUNT_SUSPENDED',
            status: 'SUSPENDED',
            suspensionDetails: user.suspensionDetails
          });
        }
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
    if (!req.user) {
      return res.status(403).json({ 
        message: 'Forbidden: No authenticated user' 
      });
    }
    // SUPER_ADMIN has full access to any ADMIN endpoint
    if (req.user.role === 'SUPER_ADMIN' && (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN'))) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role ${req.user.role} is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
