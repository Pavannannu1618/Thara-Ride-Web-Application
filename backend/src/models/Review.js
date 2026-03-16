const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  ride: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, required: true },
  revieweeType: { type: String, enum: ['Driver', 'User'] },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 500 },
  tags: [{ type: String }],
}, { timestamps: true });

reviewSchema.index({ ride: 1 });
reviewSchema.index({ reviewee: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;