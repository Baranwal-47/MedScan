const Notification = require('../models/Notification');

const createNotification = async (userId, orderId, type, status, previousStatus = null, metadata = {}) => {
  const statusMessages = {
    pending_approval: {
      title: 'Order Pending Approval',
      message: 'Your order with prescription medicines is pending pharmacist approval.'
    },
    confirmed: {
      title: 'Order Confirmed',
      message: previousStatus === 'pending_approval' 
        ? 'Great news! Your prescription has been approved and your order is confirmed.'
        : 'Your order has been confirmed and is being prepared.'
    },
    shipped: {
      title: 'Order Shipped',
      message: 'Your order is on its way! You should receive it within 2-3 business days.'
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      message: 'Your order is out for delivery and will arrive today!'
    },
    delivered: {
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you for choosing MedScan!'
    },
    cancelled: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact support.'
    }
  };

  const { title, message } = statusMessages[status] || {
    title: 'Order Status Update',
    message: `Your order status has been updated to ${status}.`
  };

  try {
    const notification = new Notification({
      user: userId,
      order: orderId,
      type,
      title,
      message,
      status,
      previousStatus,
      metadata
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ user: userId, isRead: false });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

module.exports = {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
