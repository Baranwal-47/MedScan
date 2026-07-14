const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  ocrEngine: {
    type: String,
    enum: ['trocr', 'ocrspace', 'client', 'none'],
    default: 'none'
  },
  matchedMedicines: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    query: String
  }],
  unmatchedNames: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
