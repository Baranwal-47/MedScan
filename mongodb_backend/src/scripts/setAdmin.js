// Run once: node src/scripts/setAdmin.js
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = require('../config/database');
const User = require('../models/User');

const TARGET_EMAIL = '22bcsd01@iiitdmj.ac.in';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const setAdminRole = async () => {
  try {
    await connectDB();

    const user = await User.findOne({ email: TARGET_EMAIL.toLowerCase() });

    if (!user) {
      console.log(`User not found: ${TARGET_EMAIL}`);
      return;
    }

    user.role = 'admin';
    await user.save();
    console.log(`Admin role set for: ${TARGET_EMAIL}`);
  } catch (error) {
    console.error('Failed to set admin role:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

setAdminRole();