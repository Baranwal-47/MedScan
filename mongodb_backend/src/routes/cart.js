const express = require('express');
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.medicine', 'name price image_url prescriptionRequired composition manufacturer');
    
    if (!cart) {
      return res.json({ success: true, data: { items: [], totalAmount: 0 } });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { medicineId, quantity = 1 } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Extract numeric price
    const price = parseFloat(medicine.price.replace(/[^\d.]/g, '')) || 0;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      item => item.medicine.toString() === medicineId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        medicine: medicineId,
        quantity,
        price: medicine.price
      });
    }

    // Calculate total
    cart.totalAmount = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();
    await cart.populate('items.medicine', 'name price image_url prescriptionRequired composition manufacturer');

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update item quantity
router.put('/update', protect, async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.medicine.toString() === medicineId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();
    await cart.populate('items.medicine', 'name price image_url prescriptionRequired composition manufacturer');

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:medicineId', protect, async (req, res) => {
  try {
    const { medicineId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.medicine.toString() !== medicineId);

    // Recalculate total
    cart.totalAmount = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();
    await cart.populate('items.medicine', 'name price image_url prescriptionRequired composition manufacturer');

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cart
router.delete('/clear', protect, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
