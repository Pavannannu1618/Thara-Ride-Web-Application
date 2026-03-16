const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/create-order', protect, paymentController.createPaymentOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
router.get('/history', protect, paymentController.getPaymentHistory);

module.exports = router;