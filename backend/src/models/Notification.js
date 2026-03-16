const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['ride_update', 'payment', 'promo', 'system', 'sos', 'referral'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  channel: { type: String, enum: ['push', 'sms', 'email', 'in_app'], default: 'in_app' },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30-day TTL

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;