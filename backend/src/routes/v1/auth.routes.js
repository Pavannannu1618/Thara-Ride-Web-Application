const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth.controller');
const { protect }  = require('../../middlewares/auth.middleware');
const { authLimiter, otpLimiter } = require('../../middlewares/rateLimit.middleware');

// ── Public ──
router.post('/send-otp',         otpLimiter,  controller.sendOTP);
router.post('/verify-otp',       authLimiter, controller.verifyOTP);
router.post('/refresh',          authLimiter, controller.refreshToken);
router.post('/driver/register',               controller.registerDriver);

// ── Protected ──
router.post('/logout',   protect, controller.logout);
router.get('/me',        protect, controller.getMe);
router.put('/profile',   protect, controller.updateProfile);

module.exports = router;