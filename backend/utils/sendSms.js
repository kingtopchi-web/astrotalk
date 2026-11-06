/**
 * SMS Notification Utility
 * Supports multiple SMS gateways (Fast2SMS, Twilio, Generic Webhook, Console Mock fallback)
 */

const sendViaFast2SMS = async ({ phone, message }) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  // Clean phone number (strip +91 or spaces for Indian numbers)
  const cleanNumber = phone.replace(/\D/g, '').slice(-10);

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: cleanNumber
    })
  });

  const data = await response.json();
  console.log('📱 Fast2SMS Response:', data);
  return data;
};

const sendViaTwilio = async ({ phone, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return false;

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', formattedPhone);
  params.append('From', fromNumber);
  params.append('Body', message);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const data = await response.json();
  console.log('📱 Twilio SMS Response:', data);
  return data;
};

const sendViaGenericWebhook = async ({ phone, message }) => {
  const gatewayUrl = process.env.SMS_GATEWAY_URL;
  if (!gatewayUrl) return false;

  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.SMS_GATEWAY_TOKEN ? { 'Authorization': `Bearer ${process.env.SMS_GATEWAY_TOKEN}` } : {})
    },
    body: JSON.stringify({
      to: phone,
      message: message
    })
  });

  const data = await response.text();
  console.log('📱 Custom SMS Gateway Response:', data);
  return data;
};

/**
 * Main SMS Dispatcher
 * @param {Object} options - { phone, message }
 */
const sendSms = async ({ phone, message }) => {
  if (!phone) {
    console.warn('⚠️ sendSms skipped: No phone number provided');
    return false;
  }

  try {
    // 1. Fast2SMS
    if (process.env.FAST2SMS_API_KEY) {
      return await sendViaFast2SMS({ phone, message });
    }

    // 2. Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await sendViaTwilio({ phone, message });
    }

    // 3. Generic SMS Gateway URL
    if (process.env.SMS_GATEWAY_URL) {
      return await sendViaGenericWebhook({ phone, message });
    }

    // Fallback log for development / deployment when SMS provider env vars are not set
    console.log(`\n📱 [SMS NOTIFICATION DISPATCHED]`);
    console.log(`   To: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log(`   Status: Logged successfully (set FAST2SMS_API_KEY or TWILIO_* in .env to deliver live cellular SMS)\n`);
    return { success: true, simulated: true };
  } catch (error) {
    console.error('❌ Failed to dispatch SMS:', error.message);
    return false;
  }
};

module.exports = {
  sendSms
};

