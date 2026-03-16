const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  ride: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'wallet', 'corporate'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['pending', 'captured', 'refunded', 'failed'],
    default: 'pending',
  },
  gateway: { type: String, enum: ['razorpay', 'stripe', 'cash'] },
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  commission: {
    platform: Number,
    driver: Number,
  },
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    gatewayRefundId: String,
  },
}, { timestamps: true });

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ ride: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;