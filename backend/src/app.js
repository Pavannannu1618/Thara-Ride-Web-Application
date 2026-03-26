const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const compression = require('compression');
const geoRoutes = require('./routes/v1/geo.routes');

const authRoutes = require('./routes/v1/auth.routes');
const rideRoutes = require('./routes/v1/ride.routes');
const driverRoutes = require('./routes/v1/driver.routes');
const paymentRoutes = require('./routes/v1/payment.routes');
const adminRoutes = require('./routes/v1/admin.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const logger = require('./utils/logger');

const app = express();

app.get('/', (req, res) => {
  res.json({ success: true, message: '🚀 Thara Ride API is running' });
});
// ── Security Middleware ──
app.use(helmet({ contentSecurityPolicy: true }));
app.use(cors({
  origin: (origin, callback) => {
    const clientUrls = process.env.CLIENT_URLS || '';
    const allowed = clientUrls
      .split(',')
      .map(url => url.trim().replace(/\/$/, '')) // Remove trailing slash
      .filter(url => url.length > 0);
    
    const normalizedOrigin = origin?.replace(/\/$/, ''); // Normalize incoming origin
    
    console.log('📋 CORS Configuration:', { 
      clientUrls: process.env.CLIENT_URLS, 
      processedAllowed: allowed,
      incomingOrigin: origin,
      normalizedOrigin: normalizedOrigin
    });
    
    if (!origin || allowed.includes(normalizedOrigin)) {
      console.log('✅ CORS Allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS Blocked for origin:', origin, 'Allowed:', allowed);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Rate Limiting ──
app.use('/api', apiLimiter);

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ──
app.use('/api/v1/geo', geoRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── Error Handling ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;