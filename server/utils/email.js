const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `LMS Platform <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        if (options.attachments) {
            mailOptions.attachments = options.attachments;
        }

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Email could not be sent');
    }
};

const sendVerificationEmail = async (email, verificationCode) => {
    const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Please use the following verification code to complete your registration:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h3 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h3>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

    await sendEmail({
        email,
        subject: 'Email Verification - LMS Platform',
        html
    });
};

module.exports = { sendEmail, sendVerificationEmail };