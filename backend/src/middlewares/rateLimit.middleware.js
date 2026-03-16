const rateLimit = require('express-rate-limit');

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max:      100,
  message:  { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Auth endpoints (login, verify)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, error: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// OTP sending — very strict
exports.otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      5,
  message:  { success: false, error: 'Too many OTP requests, please try again in an hour' },
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.body?.phone || req.ip,
});