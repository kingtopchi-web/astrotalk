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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (notificationPreferences) {
      user.notificationPreferences = {
        email: { ...(user.notificationPreferences?.email || {}), ...(notificationPreferences.email || {}) },
        push: { ...(user.notificationPreferences?.push || {}), ...(notificationPreferences.push || {}) }
      };
      user.markModified('notificationPreferences');
    }
    if (privacySettings) {
      user.privacySettings = { ...(user.privacySettings || {}), ...(privacySettings || {}) };
      user.markModified('privacySettings');
    }
    if (theme) user.theme = theme;
    if (language) user.language = language;
    
    await user.save();
    
    res.json({ message: 'Preferences updated successfully', user, notificationPreferences: user.notificationPreferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
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

exports.sendTestEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return res.status(400).json({ message: 'User does not have a registered email address' });
    }

    const sendEmail = require('../utils/sendEmail');
    const platformName = process.env.FROM_NAME || 'ExpertHub';

    const info = await sendEmail({
      email: user.email,
      subject: `🔔 Test Notification Email - ${platformName}`,
      message: `Hello ${user.name || 'User'},\n\nThis is a test notification email from ${platformName} to confirm that your email notifications are properly configured.\n\nSent to: ${user.email}\nTime: ${new Date().toLocaleString()}`,
      htmlMessage: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">🔔 Test Email Notification</h2>
          </div>
          <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${user.name || 'User'}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
            This is a test notification email from <strong>${platformName}</strong> confirming that your email delivery is fully active and working properly!
          </p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #64748b;"><strong>Recipient:</strong> ${user.email}</p>
            <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Status:</strong> Active & Connected</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">${platformName} · Consultation Marketplace Platform</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: `Test email successfully sent to ${user.email}! Please check your inbox (and spam folder).`,
      messageId: info?.messageId || info?.id
    });
  } catch (error) {
    console.error('Test email delivery failed:', error);
    res.status(500).json({
      success: false,
      message: `Email delivery failed: ${error.message || 'SMTP connection error'}`
    });
  }
};
