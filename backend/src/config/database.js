const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50,
  };

  mongoose.connection.on('connected', () => logger.info('Mongoose connected to DB'));
  mongoose.connection.on('error', (err) => logger.error('Mongoose connection error:', err));
  mongoose.connection.on('disconnected', () => logger.warn('Mongoose disconnected'));

  await mongoose.connect(process.env.MONGODB_URI, options);
};

const disconnectDB = async () => {
  await mongoose.connection.close();
};

module.exports = { connectDB, disconnectDB };