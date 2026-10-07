const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // If email config is missing in .env, create a test account (Ethereal Email)
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('Using Ethereal Email for testing');
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
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
