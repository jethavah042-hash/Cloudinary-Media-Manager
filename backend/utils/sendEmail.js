const nodemailer = require('nodemailer');

/**
 * Send an email via Nodemailer (configured for Gmail or custom SMTP)
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    console.error('[sendEmail Error]: EMAIL_USER / EMAIL_PASS environment variables are not configured.');
    throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
  }

  // Create transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // remove spaces from Gmail app password if any
    }
  });

  const mailOptions = {
    from: `"Cloudinary Media Manager" <${user}>`,
    to,
    subject,
    text: text || '',
    html: html || ''
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

/**
 * Generate formatted OTP email HTML
 * @param {string} otp - 6-digit code
 * @param {string} name - User's name
 */
const getOtpEmailTemplate = (otp, name = 'User') => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <tr>
        <td style="background-color: #2563eb; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
            Cloudinary Media Manager
          </h1>
          <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">
            Password Reset Request
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <p style="color: #1e293b; font-size: 15px; line-height: 24px; margin-top: 0;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 22px;">
            We received a request to reset the password for your Cloudinary Media Manager account. Use the 6-digit verification code below to complete your password reset:
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 8px; padding: 14px 28px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #1d4ed8; letter-spacing: 6px;">
                ${otp}
              </span>
            </div>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 18px;">
              <strong>Security Notice:</strong> This OTP is valid for <strong>10 minutes</strong> and can only be used once. Do not share this code with anyone.
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 20px; margin-bottom: 0;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Cloudinary Media Manager. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

module.exports = {
  sendEmail,
  getOtpEmailTemplate
};
