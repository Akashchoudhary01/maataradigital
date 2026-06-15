require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { startCronJobs } = require('./jobs/repaymentJobs');

// Route imports
const authRoutes = require('./routes/authRoutes');
const borrowerRoutes = require('./routes/borrowerRoutes');
const loanRoutes = require('./routes/loanRoutes');
const repaymentRoutes = require('./routes/repaymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Auth-specific rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Loan Management API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start cron jobs
startCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
