const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: String,
    required: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  doctorName: {
    type: String,
    required: function() { return this.prescriptionRequired; }
  },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'cod'],
    default: 'card'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  // Only generate orderNumber if it's a new document and doesn't have one
  if (this.isNew && !this.orderNumber) {
    try {
      // Generate a unique order number
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.orderNumber = `ORD${timestamp}${randomNum}`;
      
      // Check if this order number already exists (unlikely but safe)
      const existingOrder = await mongoose.model('Order').findOne({ orderNumber: this.orderNumber });
      if (existingOrder) {
        // If by chance it exists, add more randomness
        this.orderNumber = `ORD${timestamp}${randomNum}${Math.floor(Math.random() * 100)}`;
      }
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback order number generation
      this.orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
  }
  next();
});



module.exports = mongoose.model('Order', orderSchema);
