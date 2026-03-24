const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  // Silently ignore Render's health checker pinging /
  if (req.originalUrl === '/') {
    return res.status(200).json({ success: true, message: '🚀 Thara Ride API is running' });
  }

  const error = new Error(`Not Found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log — full stack in dev, compact in production
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  } else {
    // Only log actual server errors (5xx), skip expected 4xx noise
    if (statusCode >= 500) {
      logger.error(`${statusCode} - ${message} - ${req.method} ${req.originalUrl}`);
    }
  }

  res.status(statusCode).json({
    success: false,
    error:   message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };