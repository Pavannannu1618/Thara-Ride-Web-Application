const twilio = require('twilio');
const admin  = require('firebase-admin');

// ── Twilio client (lazy — only if configured) ──
let twilioClient = null;
const getTwilio = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// ── Firebase (lazy — only if configured) ──
let firebaseReady = false;
const getFirebase = () => {
  if (firebaseReady) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = typeof raw === 'string' && raw.trim().startsWith('{')
      ? JSON.parse(raw)
      : require(raw);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    firebaseReady = true;
    return admin;
  } catch (e) {
    console.warn('[Firebase] Init failed:', e.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SMS via Twilio Messaging
// ─────────────────────────────────────────────────────────────────────────────
const sendSMS = async (to, body) => {
  const client = getTwilio();
  if (!client) {
    console.log('[DEV] SMS to', to, ':', body);
    return { success: true, dev: true };
  }
  try {
    const msg = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to,
    });
    return { success: true, sid: msg.sid };
  } catch (e) {
    console.error('[Twilio SMS] Error:', e.message);
    throw e;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OTP via Twilio Verify
// ─────────────────────────────────────────────────────────────────────────────
const sendOTP = async (phone) => {
  const client = getTwilio();  // ← use getter, not bare variable

  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    console.warn('[Twilio] Not configured — falling back to dev OTP mode');
    throw Object.assign(
      new Error('Twilio not configured'),
      { status: 500 }
    );
  }

  // Twilio Verify requires E.164 format: +91XXXXXXXXXX
  const e164 = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to:      e164,
        channel: 'sms',
      });

    console.log(`[Twilio] OTP sent to ${e164} — status: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (err) {
    console.error('[Twilio] sendOTP error:', err.message);
    throw Object.assign(
      new Error('Failed to send OTP. Please try again.'),
      { status: 500 }
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Verify OTP via Twilio Verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTP = async (phone, code) => {
  const client = getTwilio();  // ← use getter, not bare variable

  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    throw Object.assign(new Error('Twilio not configured'), { status: 500 });
  }

  const e164 = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to:   e164,
        code: String(code),
      });

    if (result.status !== 'approved') {
      throw Object.assign(new Error('Invalid OTP'), { status: 400 });
    }

    return { success: true };
  } catch (err) {
    if (err.status) throw err;  // re-throw known errors (Invalid OTP etc.)
    console.error('[Twilio] verifyOTP error:', err.message);
    throw Object.assign(new Error('OTP verification failed'), { status: 400 });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Push notification via Firebase FCM
// ─────────────────────────────────────────────────────────────────────────────
const sendPush = async (fcmToken, title, body, data = {}) => {
  const fb = getFirebase();
  if (!fb || !fcmToken) {
    console.log('[DEV] Push:', title, body);
    return { success: true, dev: true };
  }
  try {
    const res = await fb.messaging().send({
      token:        fcmToken,
      notification: { title, body },
      data,
    });
    return { success: true, messageId: res };
  } catch (e) {
    console.error('[Firebase Push] Error:', e.message);
    return { success: false, error: e.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Notify user — push preferred, SMS fallback
// ─────────────────────────────────────────────────────────────────────────────
const notifyUser = async (userId, title, body, data = {}) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('fcmToken phone');
    if (!user) return;

    if (user.fcmToken) {
      return await sendPush(user.fcmToken, title, body, data);
    } else if (user.phone) {
      return await sendSMS(user.phone, `${title}: ${body}`);
    }
  } catch (e) {
    console.error('[notifyUser] Error:', e.message);
  }
};

module.exports = {
  sendSMS,
  sendOTP,
  verifyOTP,
  sendPush,
  notifyUser,
};