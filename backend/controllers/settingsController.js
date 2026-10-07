const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile, bio, location, gender, dateOfBirth } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (mobile !== undefined) user.mobile = mobile;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    
    await user.save();
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { notificationPreferences, privacySettings, theme, language } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (notificationPreferences) user.notificationPreferences = notificationPreferences;
    if (privacySettings) user.privacySettings = privacySettings;
    if (theme) user.theme = theme;
    if (language) user.language = language;
    
    await user.save();
    
    res.json({ message: 'Preferences updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.status = 'SUSPENDED'; // Simulate deactivation
    await user.save();
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
