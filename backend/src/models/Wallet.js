const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, refPath: 'ownerType', required: true },
  ownerType: { type: String, enum: ['User', 'Driver'], required: true },
  balance: { type: Number, default: 0, min: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit', 'refund', 'bonus'] },
    amount: Number,
    note: String,
    rideRef: { type: Schema.Types.ObjectId, ref: 'Ride' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

walletSchema.index({ owner: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;