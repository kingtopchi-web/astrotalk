const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // 1. Direct Gmail Service
  if (process.env.EMAIL_SERVICE === 'gmail' || (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail'))) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  // 2. Custom SMTP (Host + Port)
  else if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } 
  // 3. Fallback: Ethereal test inbox (Fake mail for local dev without SMTP)
  else {
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
    from: `${process.env.FROM_NAME || 'ExpertHub'} <${process.env.FROM_EMAIL || 'noreply@experthub.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.htmlMessage || `<p>${options.message}</p>`
  };

  const info = await transporter.sendMail(message);

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log('Test Email URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
