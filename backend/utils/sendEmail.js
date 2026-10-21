const nodemailer = require('nodemailer');

const createGmailTransporter = (port = 465) => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    family: 4, // Critical for Render/Cloud: forces IPv4 to avoid ESOCKET timeout
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
    console.log('⚠️ No Gmail/SMTP credentials in .env. Using Ethereal Email mock for testing.');
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
    // If port 465 failed on Gmail (e.g. ESOCKET or port blocked on Render), automatically retry with port 587 IPv4
    if (isGmail) {
      console.warn(`Gmail port 465 failed (${err.code || err.message}), retrying on port 587 IPv4...`);
      const fallbackTransporter = createGmailTransporter(587);
      return await fallbackTransporter.sendMail(message);
    }
    throw err;
  }
};

module.exports = sendEmail;
