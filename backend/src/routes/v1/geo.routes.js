const express    = require('express');
const router     = express.Router();
const geoCtrl    = require('../../controllers/geo.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Both routes require auth so random internet users can't abuse your proxy
router.get('/search',  protect, geoCtrl.search);
router.get('/reverse', protect, geoCtrl.reverse);
router.get('/details', protect, geoCtrl.details);

module.exports = router;