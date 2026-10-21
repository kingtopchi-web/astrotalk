const nodemailer = require('nodemailer');

const sendViaResend = async (options) => {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromSender = process.env.RESEND_FROM || `${process.env.FROM_NAME || 'ExpertHub'} <onboarding@resend.dev>`;

  const result = await resend.emails.send({
    from: fromSender,
    to: [options.email],
    subject: options.subject,
    text: options.message,
    html: options.htmlMessage || `<p>${options.message}</p>`,
  });

  if (result.error) {
    console.error('Resend delivery error:', result.error);
    throw new Error(result.error.message || 'Resend API failed to send email');
  }

  console.log('✅ Email successfully sent via Resend HTTP API! ID:', result.data?.id);
  return result.data;
};

const sendViaBrevo = async (options) => {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'shiwanksingh11@gmail.com';
  const senderName = process.env.FROM_NAME || 'ExpertHub';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.email }],
      subject: options.subject,
      textContent: options.message,
      htmlContent: options.htmlMessage || `<p>${options.message}</p>`
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Brevo API error:', data);
    throw new Error(data.message || 'Brevo API failed');
  }

  console.log('✅ Email successfully sent via Brevo HTTP API! MessageId:', data.messageId);
  return data;
};

const createGmailTransporter = (port = 465) => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    family: 4, // Force IPv4
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendEmail = async (options) => {
  // 1. Resend HTTP API (Port 443 - Recommended for Render Cloud)
  if (process.env.RESEND_API_KEY) {
    return await sendViaResend(options);
  }

  // 2. Brevo HTTP API (Port 443 - Alternative for Render Cloud)
  if (process.env.BREVO_API_KEY) {
    return await sendViaBrevo(options);
  }

  // 3. SMTP (Gmail or custom SMTP - works great on localhost)
  let transporter;
  const isGmail = process.env.EMAIL_SERVICE === 'gmail' || (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail'));

  if (isGmail) {
    transporter = createGmailTransporter(465);
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('⚠️ No Gmail/SMTP/Resend credentials in .env. Using Ethereal Email mock for testing.');
  }

  const message = {
    from: `${process.env.FROM_NAME || 'ExpertHub'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@experthub.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.htmlMessage || `<p>${options.message}</p>`
  };

  try {
    return await transporter.sendMail(message);
  } catch (err) {
    // If port 465 failed on Gmail, retry with port 587 IPv4
    if (isGmail) {
      console.warn(`Gmail port 465 failed (${err.code || err.message}), retrying on port 587 IPv4...`);
      const fallbackTransporter = createGmailTransporter(587);
      return await fallbackTransporter.sendMail(message);
    }
    throw err;
  }
};

module.exports = sendEmail;
