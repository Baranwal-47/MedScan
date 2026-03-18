const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to generate order number
const generateOrderNumber = async () => {
  let orderNumber;
  let isUnique = false;
  
  while (!isUnique) {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    orderNumber = `ORD${timestamp}${randomNum}`;
    
    // Check if this order number already exists
    const existingOrder = await Order.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return orderNumber;
};

// Create order from cart
router.post('/create', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, doctorName } = req.body;

    // Validate required fields
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete shipping address is required' 
      });
    }

    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.medicine', 'name price prescriptionRequired');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check if any item requires prescription
    const requiresPrescription = cart.items.some(item => item.medicine.prescriptionRequired);

    if (requiresPrescription && !doctorName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor name is required for prescription medicines' 
      });
    }

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order items
    const orderItems = cart.items.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      price: item.price,
      prescriptionRequired: item.medicine.prescriptionRequired
    }));

    // Set order status based on prescription requirement
    const status = requiresPrescription ? 'pending_approval' : 'confirmed';

    // Calculate estimated delivery (3-7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (requiresPrescription ? 7 : 3));

    const order = new Order({
      user: req.user._id,
      orderNumber, // ✅ Explicitly set the order number
      items: orderItems,
      totalAmount: cart.totalAmount,
      status,
      prescriptionRequired: requiresPrescription,
      doctorName: requiresPrescription ? doctorName : undefined,
      shippingAddress,
      paymentMethod,
      estimatedDelivery
    });

    await order.save();

    // Clear cart after order creation
    await Cart.findOneAndDelete({ user: req.user._id });

    await order.populate('items.medicine', 'name price image_url composition manufacturer');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  }
});

// Rest of your routes remain the same...
// Get user's orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .populate('items.medicine', 'name price image_url composition manufacturer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-medicines', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all delivered orders for the user
    const deliveredOrders = await Order.find({ 
      user: req.user._id,
      status: 'delivered'
    })
    .populate('items.medicine', 'name price image_url composition manufacturer prescriptionRequired uses side_effects')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Flatten the medicines from all orders and add order context
    const medicines = [];
    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        medicines.push({
          medicine: item.medicine,
          quantity: item.quantity,
          price: item.price,
          prescriptionRequired: item.prescriptionRequired,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          deliveredDate: order.updatedAt, // Assuming updatedAt is when it was marked delivered
          doctorName: order.doctorName
        });
      });
    });

    // Get total count of delivered medicines
    const totalDeliveredOrders = await Order.countDocuments({ 
      user: req.user._id, 
      status: 'delivered' 
    });

    // Get unique medicine statistics
    const uniqueMedicines = new Set();
    let totalQuantity = 0;
    let prescriptionMedicines = 0;

    medicines.forEach(item => {
      uniqueMedicines.add(item.medicine._id.toString());
      totalQuantity += item.quantity;
      if (item.prescriptionRequired) prescriptionMedicines++;
    });

    const stats = {
      totalOrders: totalDeliveredOrders,
      uniqueMedicines: uniqueMedicines.size,
      totalQuantity,
      prescriptionMedicines
    };

    res.json({
      success: true,
      data: medicines,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeliveredOrders / limit),
        totalCount: medicines.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all orders
router.get('/admin/all', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.medicine', 'name price image_url')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update order status
router.put('/admin/:orderId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending_approval', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate('items.medicine', 'name price image_url')
     .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.medicine', 'name price image_url composition manufacturer prescriptionRequired')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// Get user's delivered medicines


// Get medicine usage history for a specific medicine
router.get('/medicine-history/:medicineId', protect, async (req, res) => {
  try {
    const { medicineId } = req.params;

    const orders = await Order.find({
      user: req.user._id,
      status: 'delivered',
      'items.medicine': medicineId
    })
    .populate('items.medicine', 'name composition manufacturer')
    .sort({ createdAt: -1 });

    const history = [];
    orders.forEach(order => {
      const medicineItem = order.items.find(item => 
        item.medicine._id.toString() === medicineId
      );
      
      if (medicineItem) {
        history.push({
          orderNumber: order.orderNumber,
          quantity: medicineItem.quantity,
          price: medicineItem.price,
          orderDate: order.orderDate,
          deliveredDate: order.updatedAt,
          doctorName: order.doctorName
        });
      }
    });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
