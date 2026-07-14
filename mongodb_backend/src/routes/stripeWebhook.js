const Order = require('../models/Order');
const { createNotification } = require('../services/notificationService');

// Stripe webhook with signature verification. Mounted in server.js with
// express.raw() BEFORE the global JSON parser so req.body stays a Buffer.
module.exports = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Invalid signature' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'completed') {
        order.paymentStatus = 'completed';
        order.stripePaymentIntentId = intent.id;
        if (order.status !== 'pending_approval') order.status = 'confirmed';
        await order.save();
        createNotification(order.user, order._id, 'order_status_change', order.status).catch(() => {});
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
    }
  }

  res.json({ received: true });
};
