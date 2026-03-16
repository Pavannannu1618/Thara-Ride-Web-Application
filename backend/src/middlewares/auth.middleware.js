const jwt   = require('jsonwebtoken');
const redis = require('../config/redis');
const User  = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    // ── Blacklist check (non-fatal) ──
    try {
      const blacklisted = await redis.get('bl:' + token);
      if (blacklisted)
        return res.status(401).json({ success: false, error: 'Token revoked' });
    } catch (e) { /* Redis down — skip */ }

    // ── Verify JWT ──
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError')
        return res.status(401).json({ success: false, error: 'Token expired' });
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // ── Log decoded for debugging (opt-in) ──
    if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEBUG === 'true') {
      console.log('[protect] decoded:', { id: decoded.id, role: decoded.role });
    }

    // ── Try Admin first if role suggests it ──
    if (['admin', 'superadmin', 'support', 'ops'].includes(decoded.role)) {
      const admin = await Admin.findById(decoded.id).select('-password -__v');
      if (admin) {
        if (!admin.isActive)
          return res.status(403).json({ success: false, error: 'Admin account inactive' });
        req.user = {
          _id:     admin._id,
          id:      admin._id,
          name:    admin.name,
          email:   admin.email,
          role:    admin.role,   // e.g. 'superadmin'
          isAdmin: true,
        };
        if (process.env.NODE_ENV === 'development') {
          console.log('[protect] admin authenticated, role:', admin.role);
        }
        return next();
      }
    }

    // ── Try User ──
    const user = await User.findById(decoded.id).select('-__v');
    if (user) {
      if (user.isBlocked)
        return res.status(403).json({ success: false, error: 'Account blocked' });
      req.user = user;
      return next();
    }

    return res.status(401).json({ success: false, error: 'User not found' });
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };