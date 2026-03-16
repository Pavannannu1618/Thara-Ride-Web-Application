const authService = require('./auth.service');
const rideService = require('./ride.service');
const surgeService = require('./surge.service');
const geoService = require('./geo.service');
const paymentService = require('./payment.service');
const notificationService = require('./notification.service');
const walletService = require('./wallet.service');

module.exports = {
  authService,
  rideService,
  surgeService,
  geoService,
  paymentService,
  notificationService,
  walletService,
};