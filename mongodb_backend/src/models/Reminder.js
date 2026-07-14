const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  // Preset slots plus optional custom HH:MM times
  slots: [{
    type: String,
    enum: ['morning', 'afternoon', 'night']
  }],
  customTimes: [String], // "HH:MM" 24h
  active: {
    type: Boolean,
    default: true
  },
  // Dedupe key of the last fired occurrence: "YYYY-MM-DD HH:MM"
  lastFiredKey: {
    type: String,
    default: ''
  }
}, { timestamps: true });

reminderSchema.index({ user: 1, medicine: 1 }, { unique: true });

module.exports = mongoose.model('Reminder', reminderSchema);
