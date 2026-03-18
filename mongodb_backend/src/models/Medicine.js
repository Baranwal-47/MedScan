const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  link: {
    type: String,
    required: true
  },
  letter: {
    type: String,
    required: true,
    index: true
  },
  manufacturer: {
    type: String,
    default: ''
  },
  image_url: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  uses: {
    type: String,
    default: ''
  },
  side_effects: {
    type: String,
    default: ''
  },
  composition: {
    type: String,
    default: '',
    index: true
  },
  quick_tips: {
    type: String,
    default: ''
  },
  price: {
    type: String,
    default: ''
  },
  prescriptionRequired: {  // 🆕 NEW FIELD
    type: Boolean,
    default: false,
    index: true  // Add index for faster filtering
  },
  scraped_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text index for search functionality
medicineSchema.index({
  name: 'text',
  composition: 'text',
  manufacturer: 'text'
});

module.exports = mongoose.model('Medicine', medicineSchema);
