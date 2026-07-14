// Load env before any module that reads process.env at require time
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

const connectDB = require('./config/database');
const medicineRoutes = require('./routes/medicines');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notification');
const prescriptionRoutes = require('./routes/prescriptions');
const reminderRoutes = require('./routes/reminders');
const stripeWebhook = require('./routes/stripeWebhook');
const { startReminderScheduler } = require('./services/reminderScheduler');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/auth');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);

// Stripe webhook needs the raw body for signature verification — mount
// before the JSON parser.
app.post('/api/orders/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);        
app.use('/api/orders', orderRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  startReminderScheduler();
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Medicine API: http://localhost:${PORT}/api/medicines`);
  console.log(`Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`Cart API: http://localhost:${PORT}/api/cart`);      // 🆕 New
  console.log(`Orders API: http://localhost:${PORT}/api/orders`);  // 🆕 New
});
