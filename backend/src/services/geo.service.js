const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Driver = require('../models/Driver');
const { setEx, getKey, deleteKey } = require('../config/redis');
const logger = require('../utils/logger');

const generateTokens = (id, role) => ({
  accessToken: jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '15m',
  }),
  refreshToken: jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  }),
});

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const sendOTP = async (phone) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Redis with 10-min expiry
  await setEx(`otp:${phone}`, 600, otp);

  // In production, send via Twilio
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: `Your Thara Ride OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
  }

  return otp;
};

const verifyOTP = async (phone, otp) => {
  const storedOTP = await getKey(`otp:${phone}`);
  if (!storedOTP) throw new Error('OTP expired or not requested');
  if (storedOTP.toString() !== otp.toString()) throw new Error('Invalid OTP');
  await deleteKey(`otp:${phone}`);
  return true;
};

const loginOrRegisterUser = async (phone, name) => {
  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    // Create new user
    const wallet = await Wallet.create({ ownerType: 'User', balance: 0, transactions: [] });
    user = await User.create({
      phone,
      name: name || `User_${phone.slice(-4)}`,
      referralCode: generateReferralCode(),
      wallet: wallet._id,
      isVerified: true,
    });
    // Update wallet owner reference
    await Wallet.findByIdAndUpdate(wallet._id, { owner: user._id });
    isNewUser = true;
  }

  if (user.isBlocked) throw new Error('Account has been blocked');

  const tokens = generateTokens(user._id, 'customer');

  // Store refresh token in Redis
  await setEx(`refresh:${user._id}`, 7 * 24 * 3600, tokens.refreshToken);

  return { user, tokens, isNewUser };
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const stored = await getKey(`refresh:${decoded.id}`);
  if (!stored || stored !== refreshToken) throw new Error('Refresh token mismatch');

  const accessToken = jwt.sign(
    { id: decoded.id, role: decoded.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );

  return { accessToken };
};

const logout = async (accessToken, userId) => {
  // Blacklist the access token
  const decoded = jwt.decode(accessToken);
  const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
  if (ttl > 0) await setEx(`bl:${accessToken}`, ttl, '1');

  // Delete refresh token
  await deleteKey(`refresh:${userId}`);
};

module.exports = { sendOTP, verifyOTP, loginOrRegisterUser, refreshAccessToken, logout, generateTokens };