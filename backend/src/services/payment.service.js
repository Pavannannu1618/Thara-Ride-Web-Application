const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const { creditWallet } = require('./wallet.service');
const logger = require('../utils/logger');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_xxx') {
    return null; // Dev mode
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async (rideId, amount) => {
  const razorpay = getRazorpay();

  if (!razorpay) {
    // Mock order for development
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: amount * 100,
      currency: 'INR',
    };
    await Payment.findOneAndUpdate({ ride: rideId }, { gatewayOrderId: mockOrder.id });
    return mockOrder;
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `ride_${rideId}`,
    notes: { rideId: rideId.toString() },
  });

  await Payment.findOneAndUpdate({ ride: rideId }, { gatewayOrderId: order.id, gateway: 'razorpay' });
  return order;
};

const verifyAndCapturePayment = async ({ orderId, paymentId, signature, rideId }) => {
  const razorpay = getRazorpay();

  if (razorpay) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) throw new Error('Payment signature mismatch');
  }

  const payment = await Payment.findOneAndUpdate(
    { ride: rideId },
    {
      gatewayPaymentId: paymentId,
      gatewaySignature: signature,
      status: 'captured',
    },
    { new: true }
  );

  if (!payment) throw new Error('Payment record not found');

  // Commission split: 80% → driver, 20% → platform
  const driverShare = Math.ceil(payment.amount * 0.8);
  const platformShare = Math.floor(payment.amount * 0.2);

  const ride = await Ride.findById(rideId).populate('driver');
  if (ride?.driver) {
    await creditWallet(ride.driver._id, driverShare, `Ride fare - Ride #${rideId}`, rideId);
  }

  await Payment.findByIdAndUpdate(payment._id, {
    commission: { platform: platformShare, driver: driverShare },
  });

  return payment;
};

const processWebhook = async (body, signature) => {
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expectedSig !== signature) throw new Error('Invalid webhook signature');

  const { event, payload } = body;
  if (event === 'payment.captured') {
    const entity = payload.payment.entity;
    await Payment.findOneAndUpdate(
      { gatewayOrderId: entity.order_id },
      { status: 'captured', gatewayPaymentId: entity.id }
    );
  }
};

module.exports = { createOrder, verifyAndCapturePayment, processWebhook };