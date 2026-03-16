const mongoose = require('mongoose');
const { Schema } = mongoose;

const rideSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  driver: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  rideType: {
    type: String,
    enum: ['bike', 'auto', 'mini', 'sedan', 'suv', 'pool'],
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'searching', 'accepted', 'arrived', 'started', 'completed', 'cancelled'],
    default: 'searching',
    index: true,
  },
  pickup: {
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
  },
  destination: {
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
  },
  route: {
    polyline: String,
    distanceKm: Number,
    durationMins: Number,
  },
  fare: {
    baseFare: Number,
    perKm: Number,
    surgeMultiplier: { type: Number, default: 1.0 },
    totalFare: Number,
    promoDiscount: { type: Number, default: 0 },
    finalFare: Number,
  },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
  promoCode: { type: Schema.Types.ObjectId, ref: 'PromoCode' },
  otp: String,
  cancelReason: String,
  cancelledBy: { type: String, enum: ['customer', 'driver', 'system'] },
  scheduledAt: Date,
  isPool: { type: Boolean, default: false },
  co2Saved: { type: Number, default: 0 },
  driverLocationHistory: [{
    coordinates: [Number],
    time: { type: Date, default: Date.now },
  }],
  rating: {
    customerRating: Number,
    driverRating: Number,
  },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ customer: 1, createdAt: -1 });
rideSchema.index({ driver: 1, createdAt: -1 });
rideSchema.index({ status: 1, rideType: 1 });
rideSchema.index({ scheduledAt: 1 }, { sparse: true });

const Ride = mongoose.model('Ride', rideSchema);
module.exports = Ride;