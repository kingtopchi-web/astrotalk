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

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Determine user type and attach to request
      let user = await User.findById(decoded.id).select('-password');
      if (!user) {
        user = await Expert.findById(decoded.id).select('-password');
      }
      if (!user) {
        user = await Admin.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
