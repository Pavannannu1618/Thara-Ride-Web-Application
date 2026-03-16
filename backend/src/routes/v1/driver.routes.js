const express = require('express');
const router = express.Router();
const driverController = require('../../controllers/driver.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect);
router.get('/profile', driverController.getDriverProfile);
router.patch('/toggle-online', driverController.toggleOnline);
router.patch('/location', driverController.updateLocation);
router.get('/earnings', driverController.getEarnings);
router.get('/nearby-rides', driverController.getNearbyRides);

module.exports = router;