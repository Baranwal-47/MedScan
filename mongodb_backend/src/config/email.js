const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({  // Fixed: createTransport not createTransporter
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"MedScan" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to MedScan!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Hello ${name}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Thank you for joining MedScan. Your account has been successfully created and you can now:
        </p>
        <ul style="color: #666; line-height: 1.8;">
          <li>Browse our comprehensive medicine database</li>
          <li>Manage your prescriptions and orders</li>
          <li>Set medication reminders</li>
          <li>Track your health journey</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    </div>
  `,

  resetPassword: (resetLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your password for your MedScan account.
        </p>
        <p style="color: #666; line-height: 1.6;">
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #667eea; word-break: break-all;">
          ${resetLink}
        </p>
        <p style="color: #999; font-size: 12px;">
          If you didn't request this password reset, please ignore this email. Your password will not be changed.
        </p>
      </div>
    </div>
  `
,

  orderUpdate: (name, title, message) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="color: #666; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/my-orders" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View My Orders
          </a>
        </div>
      </div>
    </div>
  `,

  verifyEmail: (name, code) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Verify your email</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; text-align: center;">
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="color: #666; line-height: 1.6;">
          Enter this code on MedScan to finish creating your account:
        </p>
        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 24px 0;">
          ${code}
        </p>
        <p style="color: #999; font-size: 12px;">
          The code expires in 15 minutes. If you didn't sign up for MedScan, ignore this email.
        </p>
      </div>
    </div>
  `,

  medicineReminder: (name, medicineName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">💊 Medicine Reminder</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          It's time to take <strong>${medicineName}</strong>.
        </p>
        <p style="color: #999; font-size: 12px;">
          You're receiving this because you set a reminder on MedScan. Manage reminders from the My Medicines page.
        </p>
      </div>
    </div>
  `
};

// Fire-and-forget wrapper: never lets email failures break the caller,
// and no-ops when SMTP creds aren't configured.
const sendEmailSafe = (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !to) return;
  sendEmail(to, subject, html).catch(() => {});
};

module.exports = { sendEmail, sendEmailSafe, emailTemplates };
