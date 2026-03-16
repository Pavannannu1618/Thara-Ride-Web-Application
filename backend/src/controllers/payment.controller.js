const paymentService = require('../services/payment.service');
const Payment = require('../models/Payment');
const { walletService } = require('../services');

const createPaymentOrder = async (req, res, next) => {
  try {
    const { rideId } = req.body;
    const payment = await Payment.findOne({ ride: rideId, customer: req.user._id });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    const order = await paymentService.createOrder(rideId, payment.amount);
    res.json({ success: true, data: { order, amount: payment.amount, currency: 'INR' } });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, rideId } = req.body;
    const payment = await paymentService.verifyAndCapturePayment({ orderId, paymentId, signature, rideId });
    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    await paymentService.processWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const payments = await Payment.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('ride', 'pickup destination rideType createdAt');

    res.json({ success: true, data: { payments } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentOrder, verifyPayment, handleWebhook, getPaymentHistory };