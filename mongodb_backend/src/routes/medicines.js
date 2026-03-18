const express = require('express');
const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const protect = require('../middleware/authMiddleware');
const {
  getMedicines,
  getMedicineById,
  getMedicineStats
} = require('../controllers/medicineController');

const router = express.Router();

// ✅ SPECIFIC ROUTES FIRST (before dynamic routes)

// GET /api/medicines/stats - Get medicine statistics
router.get('/stats', getMedicineStats);

// GET /api/medicines/search - Search medicines by name or composition
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        data: []
      });
    }

    // Search by name or composition (case-insensitive)
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { composition: { $regex: query, $options: 'i' } }
      ]
    }).select('name composition price image_url prescriptionRequired manufacturer').limit(10);

    res.json({
      success: true,
      data: medicines.map(med => ({
        _id: med._id,
        name: med.name,
        composition: med.composition,
        price: med.price,
        image_url: med.image_url,
        prescriptionRequired: med.prescriptionRequired,
        manufacturer: med.manufacturer,
        stock: Math.floor(Math.random() * 100) + 1 // Simulated stock for now
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// GET /api/medicines/my - Get user's delivered medicines
router.get('/my', protect, async (req, res) => {
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
    .sort({ createdAt: -1 });

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
          deliveredDate: order.updatedAt,
          doctorName: order.doctorName
        });
      });
    });

    // Apply pagination to flattened medicines
    const paginatedMedicines = medicines.slice(skip, skip + limit);

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
      totalOrders: deliveredOrders.length,
      uniqueMedicines: uniqueMedicines.size,
      totalQuantity,
      prescriptionMedicines
    };

    res.json({
      success: true,
      data: paginatedMedicines,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(medicines.length / limit),
        totalCount: medicines.length
      }
    });
  } catch (error) {
    console.error('My medicines route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

router.get('/my-delivered', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const deliveredOrders = await Order.find({
      user: req.user._id,
      status: 'delivered'
    })
    .populate('items.medicine', 'name price image_url composition manufacturer prescriptionRequired uses side_effects')
    .sort({ createdAt: -1 });

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
          deliveredDate: order.updatedAt,
          doctorName: order.doctorName
        });
      });
    });

    const paginatedMedicines = medicines.slice(skip, skip + limit);
    const uniqueMedicines = new Set();
    let totalQuantity = 0;
    let prescriptionMedicines = 0;

    medicines.forEach(item => {
      uniqueMedicines.add(item.medicine._id.toString());
      totalQuantity += item.quantity;
      if (item.prescriptionRequired) prescriptionMedicines++;
    });

    const stats = {
      totalOrders: deliveredOrders.length,
      uniqueMedicines: uniqueMedicines.size,
      totalQuantity,
      prescriptionMedicines
    };

    res.json({
      success: true,
      data: paginatedMedicines,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(medicines.length / limit),
        totalCount: medicines.length
      }
    });
  } catch (error) {
    console.error('My delivered medicines error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/medicines/history/:medicineId - Get medicine usage history for specific medicine
router.get('/history/:medicineId', protect, async (req, res) => {
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
    console.error('Medicine history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ✅ GENERAL ROUTES

// GET /api/medicines - Get all medicines with search and pagination
router.get('/', getMedicines);

// ✅ DYNAMIC ROUTES LAST

// GET /api/medicines/:id - Get single medicine by ID
router.get('/:id', getMedicineById);

module.exports = router;
