const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail, emailTemplates } = require('../config/email');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/* ---------- Helpers ---------- */
const genToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn:'1d' });

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

    const user = await User.create({
      name, 
      email,
      passwordHash: password,
    });

    // Send welcome email
    try {
      await sendEmail(
        email,
        'Welcome to MedScan!',
        emailTemplates.welcome(name)
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({ 
      message: 'User registered successfully',
      token: genToken(user._id) 
    });
  } catch (e) { 
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Server error during registration' }); 
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
    
    res.json({ 
      token: genToken(user._id), 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender
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

module.exports = router;
