const mongoose = require('mongoose');
const { Schema } = mongoose;

const vehicleSchema = new Schema({
  driver: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  type: {
    type: String,
    enum: ['bike', 'auto', 'mini', 'sedan', 'suv'],
    required: true,
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: Number,
  color: String,
  plateNumber: { type: String, required: true, uppercase: true, unique: true },
  rcDocument: { url: String, verified: { type: Boolean, default: false } },
  insuranceDocument: {
    url: String,
    expiresAt: Date,
    verified: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
  seats: { type: Number, default: 4 },
}, { timestamps: true });

vehicleSchema.index({ driver: 1 });
vehicleSchema.index({ plateNumber: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;