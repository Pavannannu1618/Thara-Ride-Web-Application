const mongoose = require('mongoose');
const { Schema } = mongoose;

const driverSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  kycDocuments: {
    drivingLicense: { url: String, verified: { type: Boolean, default: false } },
    aadhaar: { url: String, verified: { type: Boolean, default: false } },
    rc: { url: String, verified: { type: Boolean, default: false } },
    selfie: { url: String },
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: String,
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  heading: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0, min: 1, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 100 },
  cancellationRate: { type: Number, default: 0 },
  subscription: {
    plan: { type: String, enum: ['basic', 'premium'], default: 'basic' },
    expiresAt: Date,
  },
  walletBalance: { type: Number, default: 0 },
  activeRide: { type: Schema.Types.ObjectId, ref: 'Ride', default: null },
  fcmToken: { type: String },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolder: String,
    upiId: String,
  },
}, { timestamps: true });

// CRITICAL: 2dsphere index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isOnline: 1, approvalStatus: 1 });
driverSchema.index({ user: 1 });

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;