const express = require('express');
const router = express.Router();
const rideController = require('../../controllers/ride.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/estimate', protect, rideController.estimateFare);
router.post('/book', protect, rideController.bookRide);
router.get('/history', protect, rideController.getRideHistory);
router.get('/:id', protect, rideController.getRide);
router.patch('/:id/cancel', protect, rideController.cancelRide);
router.patch('/:id/accept', protect, rideController.acceptRide);
router.patch('/:id/status', protect, rideController.updateRideStatus);
router.post('/:id/verify-otp', protect, rideController.verifyOTP);

module.exports = router;