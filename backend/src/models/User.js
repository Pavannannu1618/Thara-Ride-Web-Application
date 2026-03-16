const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  phone: {
    type:     String,
    required: true,
    unique:   true,   // index created automatically
  },
  email: {
    type:      String,
    sparse:    true,
    lowercase: true,
    trim:      true,
  },
  avatar: {
    type: String,   // S3 URL
  },
  role: {
    type:    String,
    enum:    ['rider', 'driver', 'admin', 'customer'],
    default: 'rider',
  },
  isVerified: { type: Boolean, default: false },
  isBlocked:  { type: Boolean, default: false },

  fcmToken: { type: String },   // Firebase push token

  wallet: {
    type: Schema.Types.ObjectId,
    ref:  'Wallet',
  },

  referralCode: {
    type:   String,
    unique: true,
    sparse: true,   // index created automatically
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref:  'User',
  },
  loyaltyPoints: { type: Number, default: 0 },

  language: { type: String, default: 'en' },

  sosContacts: [{
    name:  { type: String },
    phone: { type: String },
  }],

  // ── Saved quick-access addresses (Home / Work / Airport etc.) ──
  savedAddresses: [{
    label:   { type: String },   // 'home' | 'work' | 'airport'
    address: { type: String },   // human-readable string
    // GeoJSON Point for geospatial queries
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },   // [lng, lat]
    },
    // Flat array copy — easier to read/write from frontend
    coordinates: { type: [Number], default: [] },         // [lng, lat]
  }],

  // ── Address book (multiple labelled locations) ──
  address: [{
    label:    { type: String },
    location: {
      type:        { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  }],

}, { timestamps: true });

// ── Geospatial indexes ──
userSchema.index({ 'savedAddresses.location': '2dsphere' }, { sparse: true });
userSchema.index({ 'address.location':        '2dsphere' }, { sparse: true });

// phone and referralCode indexes are auto-created by unique:true above
// so we do NOT add them manually here

const User = mongoose.model('User', userSchema);
module.exports = User;