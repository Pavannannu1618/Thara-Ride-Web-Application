const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const redis  = require('../config/redis');
const User   = require('../models/User');
const Admin  = require('../models/Admin');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const TTL_REFRESH = 7 * 24 * 60 * 60;  // 7 days in seconds
const TTL_OTP     = 10 * 60;           // 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const generateTokens = (userId, role) => ({
  accessToken: jwt.sign(
    { id: userId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  ),
  refreshToken: jwt.sign(
    { id: userId.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  ),
});

/** Store hashed refresh token in Redis */
const saveRefreshToken = async (userId, refreshToken) => {
  try {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await redis.setex(`rt:${userId.toString()}`, TTL_REFRESH, hash);
  } catch (e) {
    console.warn('[Auth] Redis refresh token save failed (non-fatal):', e.message);
  }
};

/** Generate a unique referral code with collision retry */
const makeReferralCode = async (phone) => {
  for (let i = 0; i < 5; i++) {
    const code = phone.slice(-4) +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    const exists = await User.findOne({ referralCode: code }).lean();
    if (!exists) return code;
  }
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/** Create wallet for a user — non-fatal */
const createWallet = async (userId) => {
  try {
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.create({
      owner:     userId,
      ownerType: 'User',
      balance:   0,
    });
    await User.findByIdAndUpdate(userId, { wallet: wallet._id });
    return wallet._id;
  } catch (e) {
    console.error('[Auth] Wallet creation failed (non-fatal):', e.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────────────────────────────────────────
const sendPhoneOTP = async (phone) => {
  // Dev mode — no Twilio Verify SID configured
  if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`otp:${phone}`, TTL_OTP, otp);
    console.log('\n📱 DEV OTP for', phone, '→', otp, '\n');
    return { success: true, dev: true };
  }
  // Production — delegate to Twilio Verify
  const { sendOTP } = require('./notification.service');
  return sendOTP(phone);
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY OTP  →  login or register
// ─────────────────────────────────────────────────────────────────────────────
const verifyPhoneOTP = async ({ phone, otp, role = 'rider' }) => {

  // ── 1. Verify OTP ──────────────────────────────────────────────────────────
  if (process.env.TWILIO_VERIFY_SERVICE_SID) {
    // Production: Twilio holds the code — let them verify it
    // throws { status: 400 } automatically if wrong or expired
    const { verifyOTP } = require('./notification.service');
    await verifyOTP(phone, otp);
  } else {
    // Dev mode: OTP was stored in Redis by sendPhoneOTP
    let stored = null;
    try {
      stored = await redis.get(`otp:${phone}`);
    } catch (e) {
      console.warn('[Auth] Redis OTP get failed:', e.message);
    }

    if (!stored) {
      throw Object.assign(
        new Error('OTP expired. Please request a new one.'),
        { status: 400 }
      );
    }
    if (stored !== String(otp)) {
      throw Object.assign(new Error('Invalid OTP'), { status: 400 });
    }

    // Clear used OTP
    try { await redis.del(`otp:${phone}`); } catch { /* non-fatal */ }
  }

  // ── 2. Find or create user ─────────────────────────────────────────────────
  let user  = await User.findOne({ phone });
  let isNew = false;

  if (!user) {
    isNew = true;

    const referralCode = await makeReferralCode(phone);

    user = await User.create({
      phone,
      name:         `User${phone.slice(-4)}`,
      role:         role === 'driver' ? 'rider' : role,
      isVerified:   true,
      referralCode,
    });

    // Wallet — non-fatal
    const walletId = await createWallet(user._id);
    if (walletId) user.wallet = walletId;
  }

  // ── 3. Block check ─────────────────────────────────────────────────────────
  if (user.isBlocked) {
    throw Object.assign(new Error('This account has been blocked'), { status: 403 });
  }

  // ── 4. Issue tokens ────────────────────────────────────────────────────────
  const tokens = generateTokens(user._id, user.role || 'rider');
  await saveRefreshToken(user._id, tokens.refreshToken);

  return { user, tokens, isNew };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN OR REGISTER  (legacy — kept for any older controller paths)
// ─────────────────────────────────────────────────────────────────────────────
const loginOrRegisterUser = async (phone) => {
  let user = await User.findOne({ phone });

  if (!user) {
    const referralCode = await makeReferralCode(phone);
    user = await User.create({
      phone,
      name:       `User${phone.slice(-4)}`,
      isVerified: true,
      referralCode,
    });
    await createWallet(user._id);
    user = await User.findById(user._id);
  }

  if (user.isBlocked) {
    throw Object.assign(new Error('Account is blocked'), { status: 403 });
  }

  const tokens = generateTokens(user._id, user.role || 'rider');
  await saveRefreshToken(user._id, tokens.refreshToken);

  return { user, tokens };
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────────────────────────────────────
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw Object.assign(new Error('No refresh token provided'), { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  let storedHash     = null;

  try {
    storedHash = await redis.get(`rt:${decoded.id}`);
  } catch (e) {
    console.warn('[Auth] Redis refresh check failed:', e.message);
  }

  if (storedHash && storedHash !== incomingHash) {
    throw Object.assign(new Error('Refresh token already rotated'), { status: 401 });
  }

  let entity = await User.findById(decoded.id).select('-__v');
  let role   = 'rider';

  if (!entity) {
    entity = await Admin.findById(decoded.id).select('-password -__v');
    if (!entity) {
      throw Object.assign(new Error('User not found'), { status: 401 });
    }
    role = entity.role;
  } else {
    if (entity.isBlocked) {
      throw Object.assign(new Error('Account is blocked'), { status: 403 });
    }
    role = entity.role || 'rider';
  }

  const tokens = generateTokens(decoded.id, role);
  await saveRefreshToken(decoded.id, tokens.refreshToken);

  return { tokens, user: entity };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logoutUser = async (accessToken, refreshToken, userId) => {
  try {
    if (accessToken) {
      await redis.setex(`bl:${accessToken}`, 15 * 60, '1');
    }
    if (userId) {
      await redis.del(`rt:${userId.toString()}`);
    }
  } catch (e) {
    console.warn('[Auth] Logout Redis error (non-fatal):', e.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER DRIVER
// ─────────────────────────────────────────────────────────────────────────────
const registerDriver = async (data) => {
  const {
    name, phone, email,
    vehicleType, make, model, year,
    plateNumber, color,
    licenseNumber, aadhaarNumber,
  } = data;

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      name,
      phone,
      email,
      referralCode: await makeReferralCode(phone),
      isVerified:   false,
    });
  }

  const Driver  = require('../models/Driver');
  const Vehicle = require('../models/Vehicle');

  const existing = await Driver.findOne({ user: user._id });
  if (existing) {
    throw Object.assign(
      new Error('A driver is already registered with this phone number'),
      { status: 409 }
    );
  }

  const vehicle = await Vehicle.create({
    type:        vehicleType,
    make,
    model,
    year:        Number(year),
    plateNumber,
    color,
    owner:       user._id,
  });

  const driver = await Driver.create({
    user:    user._id,
    vehicle: vehicle._id,
    kycDocuments: {
      drivingLicense: { number: licenseNumber, verified: false },
      aadhaar:        { number: aadhaarNumber, verified: false },
    },
    approvalStatus: 'pending',
  });

  return { user, driver, vehicle };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  generateTokens,
  saveRefreshToken,
  sendPhoneOTP,
  verifyPhoneOTP,
  loginOrRegisterUser,
  refreshAccessToken,
  logoutUser,
  registerDriver,
};
// ```

// The only change from your current file is the `verifyPhoneOTP` function — it now branches on `TWILIO_VERIFY_SERVICE_SID`:
// ```
// TWILIO_VERIFY_SERVICE_SID set?
//   YES → call notification.service.verifyOTP (Twilio checks the code)
//   NO  → check Redis (dev mode, code stored locally)