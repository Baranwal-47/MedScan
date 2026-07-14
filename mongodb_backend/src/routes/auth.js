const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const { sendEmail, emailTemplates } = require('../config/email');
const { uploadBuffer } = require('../config/cloudinary');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ---------- Helpers ---------- */
const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn:'1d' });

/* ---------- Register ---------- */
router.post('/register', async (req,res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      emailVerified: false,
      verifyCode: code,
      verifyCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      await sendEmail(email, 'Your MedScan verification code', emailTemplates.verifyEmail(name, code));
    } catch (emailError) {
      // Can't verify without the code — don't strand a half-created account
      console.error('Failed to send verification email:', emailError);
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: "Couldn't send the verification email. Please try again." });
    }

    res.status(201).json({
      needsVerification: true,
      message: `We sent a 6-digit code to ${email}. Enter it to activate your account.`
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/* ---------- Verify email ---------- */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found for this email' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email is already verified — just sign in' });
    if (!user.verifyCode || user.verifyCode !== String(code).trim()) {
      return res.status(400).json({ message: 'Incorrect code' });
    }
    if (user.verifyCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired — sign in to get a new one' });
    }

    user.emailVerified = true;
    user.verifyCode = undefined;
    user.verifyCodeExpires = undefined;
    await user.save();

    sendEmail(user.email, 'Welcome to MedScan!', emailTemplates.welcome(user.name)).catch(() => {});

    res.json({
      message: 'Email verified',
      token: genToken(user._id, user.role)
    });
  } catch (e) {
    console.error('Verification error:', e);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

/* ---------- Login ---------- */
router.post('/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      // Re-issue a fresh code so the user can complete verification
      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.verifyCode = code;
      user.verifyCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      sendEmail(user.email, 'Your MedScan verification code', emailTemplates.verifyEmail(user.name, code)).catch(() => {});
      return res.status(403).json({
        needsVerification: true,
        message: 'Please verify your email first — we just sent you a new code.'
      });
    }

    res.json({
      token: genToken(user._id, user.role), 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/* ---------- Forgot-password ---------- */
router.post('/forgot-password', async (req,res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset/${rawToken}`;
    
    try {
      await sendEmail(
        user.email,
        'Reset Your Password - MedScan',
        emailTemplates.resetPassword(resetLink)
      );
      
      res.json({ message: 'Password reset link sent to your email' });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------- Reset-password ---------- */
router.post('/reset/:token', async (req,res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Please provide new password' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------- Profile (get / update) ---------- */
router.get('/profile', protect, (req,res) => {
  res.json(req.user);
});

router.put('/profile', protect, async (req,res) => {
  try {
    const { name, phone, gender } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, gender },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json(user);
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

/* ---------- Avatar upload (Cloudinary) ---------- */
router.post('/profile/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    const result = await uploadBuffer(req.file.buffer, 'profile-photos', req.file.mimetype);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: result.secure_url },
      { new: true }
    ).select('-passwordHash');

    res.json(user);
  } catch (e) {
    console.error('Avatar upload error:', e);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

module.exports = router;
