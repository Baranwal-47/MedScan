const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

userSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
