const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  type: {
    type: String,
    enum: ['order_status_change', 'order_created', 'order_delivered', 'prescription_approved'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    orderNumber: String,
    itemCount: Number,
    totalAmount: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
