const mongoose = require('mongoose');
const { Schema } = mongoose;

const promoCodeSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true }, // unique creates index
  description: String,
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discount: { type: Number, required: true },
  maxDiscount: Number,
  minOrderValue: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  applicableRideTypes: [String],
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

// Only add indexes not already implied by the schema field definitions
promoCodeSchema.index({ expiresAt: 1 });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
module.exports = PromoCode;