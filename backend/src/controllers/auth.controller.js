const {
  sendPhoneOTP,
  verifyPhoneOTP,
  refreshAccessToken,
  logoutUser,
  registerDriver,
} = require('../services/auth.service');

const User  = require('../models/User');
const Admin = require('../models/Admin');

// ── Phone normaliser — strips country code, spaces, dashes
const normalisePhone = (raw) => {
  let phone = raw.toString().replace(/[\s\-().]/g, '');
  if (phone.startsWith('+91'))                      phone = phone.slice(3);
  else if (phone.startsWith('0091'))                phone = phone.slice(4);
  else if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  else if (phone.startsWith('0'))                   phone = phone.slice(1);
  return phone;
};

// ── POST /api/v1/auth/send-otp ───────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone: raw } = req.body;
    if (!raw)
      return res.status(400).json({ success: false, error: 'Phone required' });

    const phone = normalisePhone(raw);

    if (!/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({
        success: false,
        error:   'Enter a valid 10-digit Indian mobile number',
      });

    await sendPhoneOTP(phone);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) { next(err); }
};

// ── POST /api/v1/auth/verify-otp ─────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone: raw, otp, role } = req.body;

    if (!raw || !otp)
      return res.status(400).json({ success: false, error: 'Phone and OTP required' });

    const phone = normalisePhone(raw);

    if (!/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({ success: false, error: 'Invalid phone number' });

    const { user, tokens, isNew } = await verifyPhoneOTP({
      phone,
      otp:  String(otp).trim(),
      role: role || 'rider',
    });

    res.json({ success: true, data: { user, tokens, isNew } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, error: 'Refresh token required' });

    const { tokens, user } = await refreshAccessToken(refreshToken);
    res.json({ success: true, data: { tokens, user } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const accessToken      = req.headers.authorization?.split(' ')[1];
    const { refreshToken } = req.body;

    if (accessToken) {
      await logoutUser(accessToken, refreshToken, req.user._id);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    // Admin path — auth.middleware sets isAdmin flag
    if (req.user?.isAdmin) {
      const admin = await Admin.findById(req.user._id).select('-password -__v');
      if (!admin)
        return res.status(404).json({ success: false, error: 'Admin not found' });

      return res.json({
        success: true,
        data: {
          user: {
            _id:     admin._id,
            name:    admin.name,
            email:   admin.email,
            role:    admin.role,
            isAdmin: true,
          },
        },
      });
    }

    // Regular user path
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('wallet', 'balance');

    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

// ── PUT /api/v1/auth/profile ──────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const ALLOWED = [
      'name',
      'email',
      'avatar',
      'language',
      'sosContacts',
      'savedAddresses',
      'address',
    ];

    const updates = {};
    ALLOWED.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, error: 'No valid fields to update' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

// ── POST /api/v1/auth/driver/register ────────────────────────────────────────
exports.registerDriver = async (req, res, next) => {
  try {
    const REQUIRED = [
      'name', 'phone', 'vehicleType',
      'make', 'model', 'year',
      'plateNumber', 'licenseNumber',
    ];
    const missing = REQUIRED.filter((f) => !req.body[f]);

    if (missing.length)
      return res.status(400).json({
        success: false,
        error:   `Missing required fields: ${missing.join(', ')}`,
      });

    const result = await registerDriver(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration submitted. Pending admin approval.',
      data:    result,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};