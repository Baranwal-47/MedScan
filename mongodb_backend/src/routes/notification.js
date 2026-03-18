const express = require('express');
const Notification = require('../models/Notification');
const { markAsRead, markAllAsRead, getUnreadCount } = require('../services/notificationService');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Get user's notifications with pagination
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'unread', 'read', or 'all'

    let query = { user: req.user._id };
    
    if (filter === 'unread') {
      query.isRead = false;
    } else if (filter === 'read') {
      query.isRead = true;
    }

    const notifications = await Notification.find(query)
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
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

// Mark notification as read
router.put('/:notificationId/read', protect, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.notificationId, req.user._id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const result = await markAllAsRead(req.user._id);
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
