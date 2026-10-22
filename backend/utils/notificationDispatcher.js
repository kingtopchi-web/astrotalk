const Notification = require('../models/Notification');
const User = require('../models/User');
const Expert = require('../models/Expert');

const getNotificationCategory = (type = '', title = '') => {
  const t = (type || '').toLowerCase();
  const text = (title || '').toLowerCase();

  if (['booking_confirmed', 'consultation_request', 'expert_ready', 'rate_consultation', 'consultation_completed', 'incoming_call', 'upcoming_session'].includes(t) ||
      text.includes('consultation') || text.includes('booking') || text.includes('call') || text.includes('session')) {
    return 'consultation';
  }

  if (['chat', 'chat_message'].includes(t) || text.includes('message') || text.includes('chat')) {
    return 'messages';
  }

  if (['wallet_topup', 'wallet_update', 'wallet_recharge', 'earnings_update', 'payout_request', 'payout_processed'].includes(t) ||
      text.includes('wallet') || text.includes('recharge') || text.includes('payout') || text.includes('earnings')) {
    return 'wallet';
  }

  if (['payment_issue', 'payment_alert', 'refund_request'].includes(t) || text.includes('payment') || text.includes('refund')) {
    return 'payment';
  }

  if (['complaint_report', 'support', 'system_alert'].includes(t) || text.includes('support') || text.includes('complaint')) {
    return 'support';
  }

  return 'general';
};

/**
 * Creates a notification in DB, emits real-time socket event, and sends email notification.
 * Respects user notificationPreferences dynamically for both Push and Email channels.
 */
const sendNotification = async ({
  recipient,
  recipientRole = 'USER',
  recipientModel = 'User',
  title,
  message,
  type = 'general',
  link = '',
  actionText = '',
  badge = '',
  data = null
}, io = null) => {
  try {
    const cat = getNotificationCategory(type, title);
    let targetUser = null;
    let targetExpert = null;

    // 1. Fetch recipient data and check preferences
    if (recipient && (recipientRole === 'USER' || recipientModel === 'User')) {
      targetUser = await User.findById(recipient).select('name email notificationPreferences');
    } else if (recipient && (recipientRole === 'EXPERT' || recipientModel === 'Expert')) {
      targetExpert = await Expert.findById(recipient).select('name email notificationPreferences');
    }

    // 2. Check Push/In-App Preference
    let shouldCreateInApp = true;
    if (targetUser?.notificationPreferences?.push) {
      if (cat in targetUser.notificationPreferences.push && targetUser.notificationPreferences.push[cat] === false) {
        shouldCreateInApp = false;
        console.log(`[NotificationDispatcher] In-App Notification skipped for user ${recipient}: push.${cat} is OFF`);
      }
    } else if (targetExpert?.notificationPreferences?.push === false) {
      shouldCreateInApp = false;
      console.log(`[NotificationDispatcher] In-App Notification skipped for expert ${recipient}: push is OFF`);
    }

    let notification = null;
    if (shouldCreateInApp) {
      notification = await Notification.create({
        recipient,
        recipientRole,
        recipientModel,
        title,
        message,
        type,
        link,
        actionText,
        badge,
        isRead: false
      });

      // Real-time Socket.io push
      if (io) {
        if (recipient) {
          io.to(`user_${recipient}`).emit('new_notification', notification);
        }
        if (recipientRole === 'ADMIN') {
          io.to('role_ADMIN').emit('new_notification', notification);
        }
        if (recipientRole === 'EXPERT') {
          io.to('role_EXPERT').emit('new_notification', notification);
        }
      }
    }

    // 3. Dynamic Email Notification
    const sendEmail = require('./sendEmail');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const platformName = process.env.FROM_NAME || 'ExpertHub';

    if (targetUser && targetUser.email) {
      const emailPrefs = targetUser.notificationPreferences?.email;
      const isEmailEnabled = !emailPrefs || emailPrefs[cat] !== false;

      if (isEmailEnabled) {
        const actionButtonHtml = link ? `
          <div style="margin-top: 24px; margin-bottom: 12px;">
            <a href="${clientUrl}${link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ${actionText || 'View Details'}
            </a>
          </div>` : '';

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">${title}</h2>
            </div>
            <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello ${targetUser.name || 'there'},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${message}</p>
            ${actionButtonHtml}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 14px;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.4;">
              You received this email notification from ${platformName}. Manage your email preferences anytime in your account Settings.
            </p>
          </div>
        `;

        sendEmail({
          email: targetUser.email,
          subject: `${title} - ${platformName}`,
          message: `${title}\n\n${message}\n\n${link ? clientUrl + link : ''}`,
          htmlMessage: html
        }).then(() => {
          console.log(`[NotificationDispatcher] Email successfully sent to user ${targetUser.email} for [${cat}]`);
        }).catch(err => {
          console.error(`[NotificationDispatcher] Failed to send email to ${targetUser.email}:`, err.message);
        });
      } else {
        console.log(`[NotificationDispatcher] Email skipped for user ${targetUser.email}: email.${cat} is OFF in settings`);
      }
    } else if (targetExpert && targetExpert.email) {
      const isEmailEnabled = targetExpert.notificationPreferences?.email !== false;

      if (isEmailEnabled) {
        const actionButtonHtml = link ? `
          <div style="margin-top: 24px; margin-bottom: 12px;">
            <a href="${clientUrl}${link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ${actionText || 'Open Consultation'}
            </a>
          </div>` : '';

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">${title}</h2>
            </div>
            <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello ${targetExpert.name || 'Expert'},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${message}</p>
            ${actionButtonHtml}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 14px;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.4;">
              Expert Consultation Platform Alert · ${platformName}
            </p>
          </div>
        `;

        sendEmail({
          email: targetExpert.email,
          subject: `${title} - ${platformName}`,
          message: `${title}\n\n${message}\n\n${link ? clientUrl + link : ''}`,
          htmlMessage: html
        }).then(() => {
          console.log(`[NotificationDispatcher] Email successfully sent to expert ${targetExpert.email} for [${cat}]`);
        }).catch(err => {
          console.error(`[NotificationDispatcher] Failed to send email to ${targetExpert.email}:`, err.message);
        });
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating dynamic notification:', err);
    return null;
  }
};

module.exports = {
  sendNotification,
  getNotificationCategory
};
