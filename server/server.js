const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const reportRoutes = require('./routes/report');
const lmsqyRoutes = require('./routes/lmsqy');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up trust proxy if behind a reverse proxy (required for IP rate limiting)
app.set('trust proxy', 1);

// Rate limiting for report generation
// This limits users to 10 report generations per day per IP
const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 reports per IP per day
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'You have reached your daily limit of free reports. Please try again tomorrow or purchase a premium report.',
    error: 'TOO_MANY_REQUESTS'
  },
  // Whitelist your own IP(s) for testing
  skip: (req) => {
    // Add your IP address(es) to this array
    const whitelist = ['127.0.0.1', '::1'];
    // Uncomment and add your actual IP if needed
    // whitelist.push('your.actual.ip.address');
    return whitelist.includes(req.ip);
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - will be used for production build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Serve fonts directory for PDF generation
app.use('/fonts', express.static(path.join(__dirname, './fonts')));

// Apply rate limiter specifically to the report generation endpoint
app.use('/api/report/generate', reportLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/report', reportRoutes);
app.use('/api', lmsqyRoutes);
// Make the lemon-squeezy routes accessible directly
app.use('/api/lemon-squeezy', lmsqyRoutes);

// Root route for API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Catch-all route for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 