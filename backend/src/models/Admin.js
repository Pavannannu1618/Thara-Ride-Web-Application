const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role:     {
      type:    String,
      enum:    ['superadmin', 'admin', 'support', 'ops'],
      default: 'admin',
    },
    permissions: [{ type: String }],
    isActive:    { type: Boolean, default: true },
    lastLogin:   { type: Date },
  },
  { timestamps: true }
);

// ── Hash password before save ──
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt   = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

// ── Instance method: compare password ──
adminSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);